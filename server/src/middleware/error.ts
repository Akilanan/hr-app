import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError } from '../lib/http';
import { env } from '../config/env';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Route not found' });
}

 
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.flatten() });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A record with that unique value already exists' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' });
    }
    return res.status(400).json({ error: 'Database request error', code: err.code });
  }

  const message = err instanceof Error ? err.message : String(err);
  console.error('[unhandled error]', {
    method: req.method,
    path: req.originalUrl,
    user: req.user?.email,
    message,
    stack: err instanceof Error ? err.stack : undefined,
  });
  return res.status(500).json({ error: env.isProd ? 'Internal server error' : message });
}
