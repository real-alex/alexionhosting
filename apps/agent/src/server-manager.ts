import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import Docker from 'dockerode';
import * as tar from 'tar-fs';
import {
  AgentServerState,
  CONTAINER_NAME_PREFIX,
  SERVER_IMAGE,
  ServerAction,
  type LogLine,
  type LogsResponse,
  type ProvisionRequest,
  type ProvisionResult,
  type ServerRuntimeStatus,
  type ServerType,
} from '@alexion/shared';
import type { AgentConfig } from './config';

/** Internal UDP port the game server process binds inside the container. */
const INTERNAL_GAME_PORT = (port: number) => `${port}/udp`;

function dockerStatus(err: unknown): number | null {
  if (err && typeof err === 'object' && 'statusCode' in err) {
    const code = (err as { statusCode?: unknown }).statusCode;
    return typeof code === 'number' ? code : null;
  }
  return null;
}

/**
 * Owns the lifecycle of game-server containers on this node. One instance per
 * agent process; all Docker interaction goes through here.
 */
export class ServerManager {
  private readonly docker: Docker;

  constructor(private readonly config: AgentConfig) {
    this.docker = new Docker(config.dockerSocket ? { socketPath: config.dockerSocket } : {});
  }

  get client(): Docker {
    return this.docker;
  }

  async dockerAvailable(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch {
      return false;
    }
  }

  async runningCount(): Promise<number> {
    try {
      const containers = await this.docker.listContainers({
        filters: JSON.stringify({ label: ['com.alexion.managed=true'], status: ['running'] }),
      });
      return containers.length;
    } catch {
      return 0;
    }
  }

  private containerName(serverId: string): string {
    return `${CONTAINER_NAME_PREFIX}${serverId}`;
  }

  private dataDirFor(serverId: string): string {
    return resolve(join(this.config.dataDir, serverId));
  }

  // ---------------------------------------------------------------------------
  // Image build
  // ---------------------------------------------------------------------------

  private async imageExists(tag: string): Promise<boolean> {
    try {
      await this.docker.getImage(tag).inspect();
      return true;
    } catch (err) {
      if (dockerStatus(err) === 404) {
        return false;
      }
      throw err;
    }
  }

  /** Builds the per-type image from templates/ if it isn't present yet. */
  async ensureImage(type: ServerType): Promise<void> {
    const tag = SERVER_IMAGE[type];
    if (await this.imageExists(tag)) {
      return;
    }

    const contextDir = join(this.config.templatesDir, type);
    if (!existsSync(join(contextDir, 'Dockerfile'))) {
      throw new Error(
        `Cannot build ${type} image: no Dockerfile at ${contextDir}. ` +
          'Check AGENT_TEMPLATES_DIR.',
      );
    }

    const tarStream = tar.pack(contextDir);
    const buildStream = await this.docker.buildImage(tarStream as NodeJS.ReadableStream, { t: tag });

    // NOTE: dockerode's followProgress only rejects on transport errors, not on
    // in-stream `{"error": ...}` build events — so we scan the events ourselves.
    await new Promise<void>((resolvePromise, reject) => {
      this.docker.modem.followProgress(
        buildStream,
        (err, events) => {
          if (err) {
            reject(err);
            return;
          }
          const failure = (events ?? []).find(
            (event): event is { error: string } =>
              !!event && typeof event === 'object' && typeof event.error === 'string',
          );
          if (failure) {
            reject(new Error(failure.error));
            return;
          }
          resolvePromise();
        },
        () => undefined,
      );
    });

    if (!(await this.imageExists(tag))) {
      throw new Error(
        `Image ${tag} was not created. The build likely failed — check the agent logs.`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async provision(req: ProvisionRequest): Promise<ProvisionResult> {
    await this.ensureImage(req.type);

    const name = this.containerName(req.serverId);
    await this.removeIfExists(name);

    const dataDir = this.dataDirFor(req.serverId);
    await mkdir(dataDir, { recursive: true });

    const portKey = INTERNAL_GAME_PORT(req.port);
    const env = [
      `SERVER_TYPE=${req.type}`,
      `SERVER_HOSTNAME=${req.hostname}`,
      `GAME_PORT=${req.port}`,
      `MAX_PLAYERS=${req.maxPlayers}`,
      `RCON_PASSWORD=${req.rconPassword}`,
      ...Object.entries(req.env ?? {}).map(([key, value]) => `${key}=${value}`),
    ];

    const container = await this.docker.createContainer({
      name,
      Image: SERVER_IMAGE[req.type],
      Hostname: `srv-${req.serverId.slice(0, 8)}`,
      Tty: true,
      Env: env,
      Labels: {
        'com.alexion.managed': 'true',
        'com.alexion.server-id': req.serverId,
        'com.alexion.type': req.type,
      },
      ExposedPorts: { [portKey]: {} },
      HostConfig: {
        PortBindings: { [portKey]: [{ HostPort: String(req.port) }] },
        Binds: [`${dataDir}:/alexion/data`],
        Memory: Math.max(64, req.memoryMb) * 1024 * 1024,
        NanoCpus: Math.round(Math.max(0.1, req.cpuCores) * 1e9),
        RestartPolicy: { Name: 'no' },
      },
    });

    return {
      serverId: req.serverId,
      containerId: container.id,
      state: AgentServerState.CREATED,
    };
  }

  async action(serverId: string, action: ServerAction): Promise<ServerRuntimeStatus> {
    const container = this.docker.getContainer(this.containerName(serverId));

    switch (action) {
      case ServerAction.START:
        await container.start().catch((err) => this.ignore(err, 304));
        break;
      case ServerAction.STOP:
        await container.stop({ t: 10 }).catch((err) => this.ignore(err, 304));
        break;
      case ServerAction.RESTART:
        await container.restart({ t: 10 });
        break;
      case ServerAction.KILL:
        await container.kill().catch((err) => this.ignore(err, 409));
        break;
      default:
        throw new Error(`Unknown action: ${action as string}`);
    }

    return this.status(serverId);
  }

  async status(serverId: string): Promise<ServerRuntimeStatus> {
    const container = this.docker.getContainer(this.containerName(serverId));

    let info: Docker.ContainerInspectInfo;
    try {
      info = await container.inspect();
    } catch (err) {
      if (dockerStatus(err) === 404) {
        return this.emptyStatus(serverId, AgentServerState.MISSING);
      }
      throw err;
    }

    const running = info.State.Running === true;
    const restarting = info.State.Restarting === true;
    const state = running
      ? AgentServerState.RUNNING
      : restarting
        ? AgentServerState.RESTARTING
        : info.State.OOMKilled || info.State.Dead
          ? AgentServerState.ERROR
          : AgentServerState.STOPPED;

    let uptimeSeconds: number | null = null;
    if (running && info.State.StartedAt) {
      const started = new Date(info.State.StartedAt).getTime();
      uptimeSeconds = Math.max(0, Math.floor((Date.now() - started) / 1000));
    }

    const { cpuPercent, memoryMb } = running
      ? await this.sampleStats(container)
      : { cpuPercent: null, memoryMb: null };

    return { serverId, state, uptimeSeconds, cpuPercent, memoryMb, players: null };
  }

  async logs(serverId: string, tail: number): Promise<LogsResponse> {
    const container = this.docker.getContainer(this.containerName(serverId));
    try {
      const buffer = (await container.logs({
        stdout: true,
        stderr: true,
        tail,
        timestamps: true,
      })) as unknown as Buffer;
      return { serverId, lines: this.parseLogs(buffer) };
    } catch (err) {
      if (dockerStatus(err) === 404) {
        return { serverId, lines: [] };
      }
      throw err;
    }
  }

  async deprovision(serverId: string): Promise<void> {
    await this.removeIfExists(this.containerName(serverId));
    await rm(this.dataDirFor(serverId), { recursive: true, force: true }).catch(() => undefined);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async removeIfExists(name: string): Promise<void> {
    try {
      await this.docker.getContainer(name).remove({ force: true });
    } catch (err) {
      if (dockerStatus(err) !== 404) {
        throw err;
      }
    }
  }

  private ignore(err: unknown, code: number): void {
    if (dockerStatus(err) !== code) {
      throw err;
    }
  }

  private emptyStatus(serverId: string, state: AgentServerState): ServerRuntimeStatus {
    return { serverId, state, uptimeSeconds: null, cpuPercent: null, memoryMb: null, players: null };
  }

  private async sampleStats(
    container: Docker.Container,
  ): Promise<{ cpuPercent: number | null; memoryMb: number | null }> {
    try {
      const stats = (await container.stats({ stream: false })) as Docker.ContainerStats;
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta =
        (stats.cpu_stats.system_cpu_usage ?? 0) - (stats.precpu_stats.system_cpu_usage ?? 0);
      const onlineCpus =
        stats.cpu_stats.online_cpus ?? stats.cpu_stats.cpu_usage.percpu_usage?.length ?? 1;

      const cpuPercent =
        systemDelta > 0 && cpuDelta > 0
          ? Number(((cpuDelta / systemDelta) * onlineCpus).toFixed(3))
          : 0;
      const memoryMb = stats.memory_stats.usage
        ? Number((stats.memory_stats.usage / (1024 * 1024)).toFixed(1))
        : null;
      return { cpuPercent, memoryMb };
    } catch {
      return { cpuPercent: null, memoryMb: null };
    }
  }

  private parseLogs(buffer: Buffer): LogLine[] {
    return buffer
      .toString('utf8')
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      // Strip Docker's stream-mux header bytes that can prefix lines on some hosts.
      .map((line) => line.replace(/^[ -]/, '').trimStart())
      .map((line) => {
        const spaceIdx = line.indexOf(' ');
        if (spaceIdx > 0) {
          const maybeTs = line.slice(0, spaceIdx);
          const parsed = new Date(maybeTs);
          if (!Number.isNaN(parsed.getTime())) {
            return { timestamp: parsed.toISOString(), message: line.slice(spaceIdx + 1) };
          }
        }
        return { timestamp: new Date().toISOString(), message: line };
      });
  }
}
