import { randomBytes, randomUUID } from 'node:crypto';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AgentServerState,
  DEFAULT_SERVER_RESOURCES,
  ServerAction,
  ServerStatus,
  UserRole,
  type AuthUser,
  type GameServer,
  type HostNode,
  type ServerResources,
  type ServerView,
} from '@alexion/shared';
import type { AppConfiguration } from '../config/configuration';
import { AgentClient } from '../nodes/agent.client';
import { NodesService } from '../nodes/nodes.service';
import { SupabaseService } from '../supabase/supabase.service';
import type { CreateServerDto } from './dto/create-server.dto';

interface ServerRow {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  status: string;
  node_id: string;
  container_id: string | null;
  host: string;
  port: number;
  query_port: number;
  rcon_password: string;
  cpu_cores: number;
  memory_mb: number;
  disk_mb: number;
  max_players: number;
  created_at: string;
  updated_at: string;
}

function toGameServer(row: ServerRow): GameServer {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    type: row.type as GameServer['type'],
    status: row.status as ServerStatus,
    nodeId: row.node_id,
    containerId: row.container_id,
    host: row.host,
    port: row.port,
    queryPort: row.query_port,
    rconPassword: row.rcon_password,
    resources: {
      cpuCores: Number(row.cpu_cores),
      memoryMb: row.memory_mb,
      diskMb: row.disk_mb,
      maxPlayers: row.max_players,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function agentStateToStatus(state: AgentServerState): ServerStatus {
  switch (state) {
    case AgentServerState.RUNNING:
      return ServerStatus.RUNNING;
    case AgentServerState.STOPPED:
    case AgentServerState.CREATED:
      return ServerStatus.STOPPED;
    case AgentServerState.RESTARTING:
      return ServerStatus.RESTARTING;
    default:
      return ServerStatus.ERROR;
  }
}

@Injectable()
export class ServersService {
  private readonly logger = new Logger(ServersService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly nodes: NodesService,
    private readonly agent: AgentClient,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  async listForUser(user: AuthUser): Promise<ServerView[]> {
    let query = this.supabase.db.from('servers').select('*').order('created_at', {
      ascending: false,
    });
    if (user.role !== UserRole.ADMIN) {
      query = query.eq('owner_id', user.id);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const servers = (data as ServerRow[]).map(toGameServer);
    const nodeMap = await this.loadNodeMap();
    return Promise.all(servers.map((server) => this.withRuntime(server, nodeMap.get(server.nodeId))));
  }

  async getForUser(user: AuthUser, id: string): Promise<ServerView> {
    const { server, node } = await this.loadOwned(user, id);
    return this.withRuntime(server, node);
  }

  async getConsole(
    user: AuthUser,
    id: string,
    tail = 200,
  ): Promise<{ serverId: string; status: ServerStatus; lines: { timestamp: string; message: string }[] }> {
    const { server, node } = await this.loadOwned(user, id);
    const logs = await this.agent.logs(node, id, tail).catch((err) => {
      this.logger.warn(`Could not fetch logs for ${id}: ${err.message}`);
      return { serverId: id, lines: [] };
    });
    return { serverId: id, status: server.status, lines: logs.lines };
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  async create(user: AuthUser, dto: CreateServerDto): Promise<ServerView> {
    const resources: ServerResources = {
      cpuCores: DEFAULT_SERVER_RESOURCES.cpuCores,
      memoryMb: dto.memoryMb ?? DEFAULT_SERVER_RESOURCES.memoryMb,
      diskMb: DEFAULT_SERVER_RESOURCES.diskMb,
      maxPlayers: dto.maxPlayers ?? DEFAULT_SERVER_RESOURCES.maxPlayers,
    };

    const node = await this.nodes.pickNode(resources.memoryMb, dto.nodeId);
    const port = await this.allocatePort(node);
    const id = randomUUID();
    const rconPassword = randomBytes(9).toString('base64url');
    const now = new Date().toISOString();

    const row: ServerRow = {
      id,
      owner_id: user.id,
      name: dto.name,
      type: dto.type,
      status: ServerStatus.PROVISIONING,
      node_id: node.id,
      container_id: null,
      host: node.publicHost,
      port,
      query_port: port,
      rcon_password: rconPassword,
      cpu_cores: resources.cpuCores,
      memory_mb: resources.memoryMb,
      disk_mb: resources.diskMb,
      max_players: resources.maxPlayers,
      created_at: now,
      updated_at: now,
    };

    const { error: insertError } = await this.supabase.db.from('servers').insert(row);
    if (insertError) {
      throw new Error(insertError.message);
    }

    try {
      const result = await this.agent.provision(node, {
        serverId: id,
        type: dto.type,
        port,
        queryPort: port,
        rconPassword,
        hostname: dto.name,
        maxPlayers: resources.maxPlayers,
        memoryMb: resources.memoryMb,
        cpuCores: resources.cpuCores,
      });

      await this.patch(id, {
        status: ServerStatus.STOPPED,
        container_id: result.containerId,
      });
      await this.nodes.adjustAllocation(node.id, resources.memoryMb);
    } catch (err) {
      this.logger.error(`Provisioning failed for ${id}: ${(err as Error).message}`);
      await this.patch(id, { status: ServerStatus.ERROR });
      throw err;
    }

    return this.withRuntime(await this.requireRow(id), node);
  }

  async runAction(
    user: AuthUser,
    id: string,
    action: ServerAction,
  ): Promise<{ serverId: string; status: ServerStatus; accepted: true }> {
    const { server, node } = await this.loadOwned(user, id);

    if (server.status === ServerStatus.SUSPENDED && action !== ServerAction.STOP) {
      throw new ForbiddenException('Server is suspended. Contact support.');
    }
    if (!server.containerId) {
      throw new ServiceUnavailableException('Server is still provisioning.');
    }

    const transitional: Record<ServerAction, ServerStatus> = {
      [ServerAction.START]: ServerStatus.STARTING,
      [ServerAction.STOP]: ServerStatus.STOPPING,
      [ServerAction.RESTART]: ServerStatus.RESTARTING,
      [ServerAction.KILL]: ServerStatus.STOPPING,
    };
    await this.patch(id, { status: transitional[action] });

    try {
      const runtime = await this.agent.action(node, id, action);
      const status = agentStateToStatus(runtime.state);
      await this.patch(id, { status });
      return { serverId: id, status, accepted: true };
    } catch (err) {
      await this.patch(id, { status: ServerStatus.ERROR });
      throw err;
    }
  }

  async remove(user: AuthUser, id: string): Promise<void> {
    const { server, node } = await this.loadOwned(user, id);
    await this.patch(id, { status: ServerStatus.DELETING });

    await this.agent.deprovision(node, id).catch((err) => {
      this.logger.warn(`Agent deprovision failed for ${id}: ${err.message}`);
    });

    const { error } = await this.supabase.db.from('servers').delete().eq('id', id);
    if (error) {
      throw new Error(error.message);
    }
    await this.nodes.adjustAllocation(node.id, -server.resources.memoryMb).catch(() => undefined);
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private async withRuntime(server: GameServer, node: HostNode | undefined): Promise<ServerView> {
    if (!node) {
      return { ...server, runtime: null };
    }
    const runtime = await this.agent.status(node, server.id).catch(() => null);
    return { ...server, runtime };
  }

  private async loadOwned(
    user: AuthUser,
    id: string,
  ): Promise<{ server: GameServer; node: HostNode }> {
    const server = await this.requireRow(id);
    if (server.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not own this server');
    }
    const node = await this.nodes.findById(server.nodeId);
    return { server, node };
  }

  private async requireRow(id: string): Promise<GameServer> {
    const { data, error } = await this.supabase.db
      .from('servers')
      .select('*')
      .eq('id', id)
      .maybeSingle<ServerRow>();
    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new NotFoundException(`Server ${id} not found`);
    }
    return toGameServer(data);
  }

  private async patch(id: string, fields: Partial<ServerRow>): Promise<void> {
    const { error } = await this.supabase.db
      .from('servers')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      throw new Error(error.message);
    }
  }

  private async allocatePort(node: HostNode): Promise<number> {
    const { data, error } = await this.supabase.db
      .from('servers')
      .select('port')
      .eq('node_id', node.id);
    if (error) {
      throw new Error(error.message);
    }
    const used = new Set((data as { port: number }[]).map((r) => r.port));
    const start = this.config.get('game.portRangeStart', { infer: true });
    const end = this.config.get('game.portRangeEnd', { infer: true });
    for (let port = start; port <= end; port += 1) {
      if (!used.has(port)) {
        return port;
      }
    }
    throw new ServiceUnavailableException('No free game ports available on the selected node.');
  }

  private async loadNodeMap(): Promise<Map<string, HostNode>> {
    const nodes = await this.nodes.list();
    return new Map(nodes.map((node) => [node.id, node]));
  }
}
