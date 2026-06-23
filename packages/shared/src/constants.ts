/** Cross-cutting platform constants shared by all apps. */
import { ServerType } from './domain/server';

/** Default UDP port SA-MP / CRMP servers listen on. */
export const DEFAULT_GAME_PORT = 7777;

/** Docker image tag per server type, built from the templates/ folder. */
export const SERVER_IMAGE: Record<ServerType, string> = {
  [ServerType.SAMP]: 'alexion/samp-server:latest',
  [ServerType.CRMP]: 'alexion/crmp-server:latest',
};

/** Human-friendly label per server type. */
export const SERVER_TYPE_LABEL: Record<ServerType, string> = {
  [ServerType.SAMP]: 'SA-MP',
  [ServerType.CRMP]: 'CRMP',
};

/** Prefix for all container names the agent manages. */
export const CONTAINER_NAME_PREFIX = 'alexion-srv-';

/** Header the API uses to present the agent shared secret. */
export const AGENT_AUTH_HEADER = 'authorization';
