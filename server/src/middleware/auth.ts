import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { ApiError } from '../lib/http';
import type { Role } from '../types';

/**
 * Requires a valid Bearer token, then confirms the account is still active and the
 * token hasn't been revoked (its `tv` must match the user's current tokenVersion).
 * Attaches req.user. The per-request DB lookup is what makes logout / password
 * change / admin reset / deactivation invalidate live tokens immediately.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) throw new ApiError(401, 'Authentication required');
    const token = header.slice('Bearer '.length).trim();

    let decoded: ReturnType<typeof verifyToken>;
    try {
      decoded = verifyToken(token);
    } catch {
      throw new ApiError(401, 'Invalid or expired token');
    }

    const account = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { isActive: true, tokenVersion: true },
    });
    if (!account || !account.isActive || account.tokenVersion !== decoded.tv) {
      throw new ApiError(401, 'Session expired, please sign in again');
    }

    req.user = { id: decoded.id, email: decoded.email, role: decoded.role, employeeId: decoded.employeeId };
    next();
  } catch (e) {
    next(e);
  }
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
