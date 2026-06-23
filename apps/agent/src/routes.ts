import { Router, type Request, type Response } from 'express';
import { ServerAction, type ProvisionRequest } from '@alexion/shared';
import type { AgentConfig } from './config';
import type { ServerManager } from './server-manager';

const VALID_ACTIONS = new Set<string>(Object.values(ServerAction));

/** Wraps an async handler so rejected promises hit the Express error handler. */
function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response, next: (err?: unknown) => void) => void {
  return (req, res, next) => {
    fn(req, res).catch(next);
  };
}

function badRequest(res: Response, message: string): void {
  res.status(400).json({ message });
}

export function createRouter(manager: ServerManager, _config: AgentConfig, startedAt: number): Router {
  const router = Router();

  router.get(
    '/health',
    asyncHandler(async (_req, res) => {
      const [dockerAvailable, runningServers] = await Promise.all([
        manager.dockerAvailable(),
        manager.runningCount(),
      ]);
      res.json({
        ok: true,
        version: process.env.npm_package_version ?? '0.1.0',
        dockerAvailable,
        runningServers,
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      });
    }),
  );

  router.post(
    '/servers',
    asyncHandler(async (req, res) => {
      const body = req.body as Partial<ProvisionRequest>;
      if (!body || typeof body.serverId !== 'string') {
        return badRequest(res, 'serverId is required');
      }
      if (body.type !== 'samp' && body.type !== 'crmp') {
        return badRequest(res, 'type must be "samp" or "crmp"');
      }
      if (typeof body.port !== 'number') {
        return badRequest(res, 'port is required');
      }

      const result = await manager.provision({
        serverId: body.serverId,
        type: body.type,
        port: body.port,
        queryPort: body.queryPort ?? body.port,
        rconPassword: body.rconPassword ?? '',
        hostname: body.hostname ?? 'Alexion Server',
        maxPlayers: body.maxPlayers ?? 50,
        memoryMb: body.memoryMb ?? 1024,
        cpuCores: body.cpuCores ?? 1,
        env: body.env,
      });
      res.status(201).json(result);
    }),
  );

  router.post(
    '/servers/:id/actions',
    asyncHandler(async (req, res) => {
      const action = (req.body as { action?: string }).action;
      if (!action || !VALID_ACTIONS.has(action)) {
        return badRequest(res, `action must be one of: ${[...VALID_ACTIONS].join(', ')}`);
      }
      const status = await manager.action(req.params.id, action as ServerAction);
      res.json(status);
    }),
  );

  router.get(
    '/servers/:id/status',
    asyncHandler(async (req, res) => {
      res.json(await manager.status(req.params.id));
    }),
  );

  router.get(
    '/servers/:id/logs',
    asyncHandler(async (req, res) => {
      const tailRaw = Number.parseInt(String(req.query.tail ?? '200'), 10);
      const tail = Number.isFinite(tailRaw) ? Math.min(Math.max(tailRaw, 1), 1000) : 200;
      res.json(await manager.logs(req.params.id, tail));
    }),
  );

  router.delete(
    '/servers/:id',
    asyncHandler(async (req, res) => {
      await manager.deprovision(req.params.id);
      res.status(204).send();
    }),
  );

  return router;
}
