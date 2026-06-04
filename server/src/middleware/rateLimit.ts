import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/http';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Dependency-free fixed-window rate limiter (in-memory).
 * Good enough for a single-node internal tool; swap for Redis if you scale out.
 */
export function rateLimit(opts: { windowMs: number; max: number; message?: string }) {
  const hits = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';

    let bucket = hits.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + opts.windowMs };
      hits.set(key, bucket);
    }
    bucket.count += 1;

    // opportunistic cleanup to bound memory
    if (hits.size > 5000) {
      for (const [k, b] of hits) if (now > b.resetAt) hits.delete(k);
    }

    if (bucket.count > opts.max) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return next(new ApiError(429, opts.message ?? 'Too many requests, please try again later.'));
    }
    next();
  };
}
