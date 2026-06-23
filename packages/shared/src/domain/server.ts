/**
 * Game server domain model.
 *
 * A "game server" is a single CRMP or SA-MP instance that a customer rents.
 * It runs inside an isolated Docker container managed by a node agent.
 */

/** The kind of game server. Drives which template/Docker image is used. */
export const ServerType = {
  SAMP: 'samp',
  CRMP: 'crmp',
} as const;
export type ServerType = (typeof ServerType)[keyof typeof ServerType];

/**
 * Lifecycle status of a game server. The API owns this value; the agent
 * reports container-level state which the API maps onto these.
 */
export const ServerStatus = {
  /** Record created, container not yet built. */
  PROVISIONING: 'provisioning',
  /** Container exists and is stopped. */
  STOPPED: 'stopped',
  /** Container is booting the game server process. */
  STARTING: 'starting',
  /** Game server process is up and accepting players. */
  RUNNING: 'running',
  /** Container is shutting down. */
  STOPPING: 'stopping',
  /** Restart in progress. */
  RESTARTING: 'restarting',
  /** Disabled by an admin (e.g. unpaid invoice). Cannot be started by customer. */
  SUSPENDED: 'suspended',
  /** Provisioning or a control action failed. Needs attention. */
  ERROR: 'error',
  /** Marked for deletion; container/volumes being removed. */
  DELETING: 'deleting',
} as const;
export type ServerStatus = (typeof ServerStatus)[keyof typeof ServerStatus];

/** Resource limits applied to a server's container. */
export interface ServerResources {
  /** Fractional CPU cores, e.g. 1 = one core. */
  cpuCores: number;
  /** Memory cap in megabytes. */
  memoryMb: number;
  /** Disk cap in megabytes for the server's data volume. */
  diskMb: number;
  /** Maximum player slots advertised by the game server. */
  maxPlayers: number;
}

/** Full game server record as stored in the platform database. */
export interface GameServer {
  id: string;
  /** Supabase auth user id of the owner. */
  ownerId: string;
  name: string;
  type: ServerType;
  status: ServerStatus;
  /** Node (host) this server is provisioned on. */
  nodeId: string;
  /** Docker container id once provisioned. Null until built. */
  containerId: string | null;
  /** Public host customers connect to. */
  host: string;
  /** Public game port (UDP for SA-MP/CRMP). */
  port: number;
  /** SA-MP query port (defaults to the game port). */
  queryPort: number;
  /** RCON admin password for the game server. */
  rconPassword: string;
  resources: ServerResources;
  createdAt: string;
  updatedAt: string;
}

/** Payload to create a new server (from the dashboard). */
export interface CreateServerInput {
  name: string;
  type: ServerType;
  /** Optional preferred node; the API picks one if omitted. */
  nodeId?: string;
  resources?: Partial<ServerResources>;
}

/** Control actions a customer can trigger on their server. */
export const ServerAction = {
  START: 'start',
  STOP: 'stop',
  RESTART: 'restart',
  KILL: 'kill',
} as const;
export type ServerAction = (typeof ServerAction)[keyof typeof ServerAction];

/** Sensible default resource tier for a new server. */
export const DEFAULT_SERVER_RESOURCES: ServerResources = {
  cpuCores: 1,
  memoryMb: 1024,
  diskMb: 5120,
  maxPlayers: 50,
};
