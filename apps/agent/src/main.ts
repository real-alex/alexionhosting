import { mkdir } from 'node:fs/promises';
import express, { type NextFunction, type Request, type Response } from 'express';
import { bearerAuth } from './auth';
import { loadConfig } from './config';
import { createRouter } from './routes';
import { ServerManager } from './server-manager';

async function main(): Promise<void> {
  const config = loadConfig();
  const startedAt = Date.now();

  await mkdir(config.dataDir, { recursive: true });
  await mkdir(config.backupDir, { recursive: true });

  const manager = new ServerManager(config);
  const dockerOk = await manager.dockerAvailable();
  if (!dockerOk) {
    // Don't crash — surface clearly so operators know the socket is missing.
    console.warn(
      '[agent] WARNING: Docker is not reachable. Check DOCKER_SOCKET / daemon. ' +
        'Provisioning will fail until Docker is available.',
    );
  }

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  // Unauthenticated liveness probe.
  app.get('/ping', (_req, res) => {
    res.json({ ok: true });
  });

  // Everything below requires the shared agent token.
  app.use(bearerAuth(config.token));
  app.use('/', createRouter(manager, config, startedAt));

  // Centralized error handler.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : 'Internal agent error';
    console.error('[agent] error:', message);
    if (res.headersSent) {
      return;
    }
    res.status(500).json({ message });
  });

  app.listen(config.port, config.host, () => {
    console.log(
      `[agent] Alexion agent listening on http://${config.host}:${config.port} ` +
        `(docker: ${dockerOk ? 'ok' : 'unavailable'}, data: ${config.dataDir})`,
    );
  });
}

void main().catch((err) => {
  console.error('[agent] fatal:', err);
  process.exit(1);
});
