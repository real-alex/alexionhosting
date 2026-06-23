/** Typed configuration loaded from environment variables. */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    // Defer the hard failure to first use so tooling (build/typecheck) still runs.
    return '';
  }
  return value;
}

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export interface AppConfiguration {
  env: string;
  api: {
    port: number;
    host: string;
    corsOrigins: string[];
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    jwtSecret: string;
  };
  agent: {
    token: string;
  };
  game: {
    portRangeStart: number;
    portRangeEnd: number;
    publicHost: string;
  };
}

export default (): AppConfiguration => ({
  env: process.env.NODE_ENV ?? 'development',
  api: {
    port: int('API_PORT', 4000),
    host: process.env.API_HOST ?? '0.0.0.0',
    corsOrigins: (process.env.API_CORS_ORIGINS ?? 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  supabase: {
    url: requireEnv('SUPABASE_URL'),
    anonKey: requireEnv('SUPABASE_ANON_KEY'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    jwtSecret: requireEnv('SUPABASE_JWT_SECRET'),
  },
  agent: {
    token: requireEnv('AGENT_TOKEN'),
  },
  game: {
    portRangeStart: int('GAME_PORT_RANGE_START', 7777),
    portRangeEnd: int('GAME_PORT_RANGE_END', 7877),
    publicHost: process.env.GAME_PUBLIC_HOST ?? '127.0.0.1',
  },
});
