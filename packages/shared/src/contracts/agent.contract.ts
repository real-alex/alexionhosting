/**
 * API <-> Agent contract.
 *
 * The central API is the only client of the agent. Every request is
 * authenticated with the shared AGENT_TOKEN bearer secret. These types are
 * the single source of truth for both sides of that HTTP boundary.
 */
import type { ServerAction, ServerType } from '../domain/server';

/** Runtime state the agent reports for a container. */
export const AgentServerState = {
  MISSING: 'missing',
  CREATED: 'created',
  RUNNING: 'running',
  STOPPED: 'stopped',
  RESTARTING: 'restarting',
  ERROR: 'error',
} as const;
export type AgentServerState = (typeof AgentServerState)[keyof typeof AgentServerState];

/** Request the API sends to provision (build + create) a server container. */
export interface ProvisionRequest {
  /** Platform server id; becomes part of the container name and volume path. */
  serverId: string;
  type: ServerType;
  /** Host UDP port to publish the game server on. */
  port: number;
  /** Host UDP port for the SA-MP query/info protocol. */
  queryPort: number;
  rconPassword: string;
  hostname: string;
  maxPlayers: number;
  /** Memory cap in MB. */
  memoryMb: number;
  /** Fractional CPU cores. */
  cpuCores: number;
  /** Extra environment variables for the container. */
  env?: Record<string, string>;
}

export interface ProvisionResult {
  serverId: string;
  containerId: string;
  state: AgentServerState;
}

/** Request to run a lifecycle action on an existing server. */
export interface ServerActionRequest {
  action: ServerAction;
}

export interface ServerRuntimeStatus {
  serverId: string;
  state: AgentServerState;
  /** Seconds since the container started, when running. */
  uptimeSeconds: number | null;
  /** Last sampled CPU usage as a fraction of one core, when available. */
  cpuPercent: number | null;
  /** Last sampled memory usage in MB, when available. */
  memoryMb: number | null;
  /** Online players, if the agent can query the game server. */
  players: number | null;
}

/** A single line from the server console log. */
export interface LogLine {
  timestamp: string;
  message: string;
}

export interface LogsResponse {
  serverId: string;
  lines: LogLine[];
}

/** Entry in a server's file listing. */
export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  sizeBytes: number;
  modifiedAt: string;
}

export interface FileListResponse {
  serverId: string;
  path: string;
  entries: FileEntry[];
}

/** Metadata about a server backup archive. */
export interface BackupInfo {
  id: string;
  serverId: string;
  sizeBytes: number;
  createdAt: string;
}

export interface BackupListResponse {
  serverId: string;
  backups: BackupInfo[];
}

/** Agent health/heartbeat payload. */
export interface AgentHealth {
  ok: boolean;
  version: string;
  dockerAvailable: boolean;
  runningServers: number;
  uptimeSeconds: number;
}
