import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { ApiError } from '../lib/http';
import type { Role } from '../types';

/** Requires a valid Bearer token; attaches req.user. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required'));
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    req.user = verifyToken(token);
  } catch {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
  next();
}

/** Restricts a route to the given roles. Must run after requireAuth. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    next();
  };
}
