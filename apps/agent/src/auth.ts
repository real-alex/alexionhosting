import type { NextFunction, Request, Response } from 'express';

/**
 * Bearer-token middleware. The central API authenticates to the agent with the
 * shared AGENT_TOKEN secret. Without a configured token the agent refuses all
 * authenticated requests (fail closed).
 */
export function bearerAuth(token: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!token) {
      res.status(500).json({ message: 'Agent AGENT_TOKEN is not configured' });
      return;
    }
    const header = req.headers.authorization;
    const provided = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : null;
    if (!provided || provided !== token) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    next();
  };
}
