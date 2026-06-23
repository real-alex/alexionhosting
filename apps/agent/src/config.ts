import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';

// Load env from the agent folder first, then fall back to the repo root .env.
for (const candidate of ['.env', resolve(process.cwd(), '..', '..', '.env')]) {
  if (existsSync(candidate)) {
    loadDotenv({ path: candidate, override: false });
  }
}

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export interface AgentConfig {
  port: number;
  host: string;
  token: string;
  dataDir: string;
  backupDir: string;
  dockerSocket: string | undefined;
  /** Absolute path to the templates/ folder, used to build server images. */
  templatesDir: string;
}

export function loadConfig(): AgentConfig {
  const dockerSocket = process.env.DOCKER_SOCKET?.trim();
  return {
    port: int('AGENT_PORT', 5000),
    host: process.env.AGENT_HOST ?? '0.0.0.0',
    token: process.env.AGENT_TOKEN ?? '',
    dataDir: resolve(process.env.AGENT_DATA_DIR ?? './data/servers'),
    backupDir: resolve(process.env.AGENT_BACKUP_DIR ?? './data/backups'),
    dockerSocket: dockerSocket && dockerSocket.length > 0 ? dockerSocket : undefined,
    templatesDir: resolve(
      process.env.AGENT_TEMPLATES_DIR ?? resolve(process.cwd(), '..', '..', 'templates'),
    ),
  };
}
