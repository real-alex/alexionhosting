/**
 * Web <-> API contract.
 *
 * Response shapes the Next.js dashboard consumes from the central API.
 */
import type { GameServer, ServerStatus } from '../domain/server';
import type { LogLine, ServerRuntimeStatus } from './agent.contract';

/** Standard error envelope returned by the API. */
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

/** A server as shown in the dashboard, enriched with live runtime data. */
export interface ServerView extends GameServer {
  /** Live runtime stats from the agent; null if the node is unreachable. */
  runtime: ServerRuntimeStatus | null;
}

export interface ServerListResponse {
  servers: ServerView[];
}

export interface ServerDetailResponse {
  server: ServerView;
}

export interface ServerConsoleResponse {
  serverId: string;
  status: ServerStatus;
  lines: LogLine[];
}

export interface ActionAcceptedResponse {
  serverId: string;
  status: ServerStatus;
  accepted: true;
}
