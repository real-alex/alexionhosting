import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AgentHealth,
  HostNode,
  LogsResponse,
  ProvisionRequest,
  ProvisionResult,
  ServerAction,
  ServerRuntimeStatus,
} from '@alexion/shared';
import type { AppConfiguration } from '../config/configuration';

/**
 * HTTP client the API uses to command a node's agent. Every request carries the
 * shared AGENT_TOKEN as a bearer secret. Uses the runtime's global fetch.
 */
@Injectable()
export class AgentClient {
  private readonly logger = new Logger(AgentClient.name);

  constructor(private readonly config: ConfigService<AppConfiguration, true>) {}

  private get token(): string {
    return this.config.get('agent.token', { infer: true });
  }

  private async request<T>(
    node: HostNode,
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const url = `${node.agentBaseUrl.replace(/\/$/, '')}${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        headers: {
          authorization: `Bearer ${this.token}`,
          'content-type': 'application/json',
          ...(init.headers ?? {}),
        },
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      this.logger.error(`Agent ${node.name} unreachable at ${url}: ${message}`);
      throw new ServiceUnavailableException(`Node ${node.name} is unreachable`);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(`Agent ${node.name} ${path} -> ${response.status}: ${body}`);
      throw new ServiceUnavailableException(
        `Agent error (${response.status}) from node ${node.name}`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  health(node: HostNode): Promise<AgentHealth> {
    return this.request<AgentHealth>(node, '/health');
  }

  provision(node: HostNode, payload: ProvisionRequest): Promise<ProvisionResult> {
    return this.request<ProvisionResult>(node, '/servers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  action(node: HostNode, serverId: string, action: ServerAction): Promise<ServerRuntimeStatus> {
    return this.request<ServerRuntimeStatus>(node, `/servers/${serverId}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  status(node: HostNode, serverId: string): Promise<ServerRuntimeStatus> {
    return this.request<ServerRuntimeStatus>(node, `/servers/${serverId}/status`);
  }

  logs(node: HostNode, serverId: string, tail = 200): Promise<LogsResponse> {
    return this.request<LogsResponse>(node, `/servers/${serverId}/logs?tail=${tail}`);
  }

  deprovision(node: HostNode, serverId: string): Promise<void> {
    return this.request<void>(node, `/servers/${serverId}`, { method: 'DELETE' });
  }
}
