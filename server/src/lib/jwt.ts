import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthUser } from '../types';

// Tokens carry `tv` (the user's tokenVersion) so they can be revoked server-side
// by bumping it (logout / password change / admin reset), and `typ` so an access
// token can't be used where a refresh token is expected and vice-versa.
type AccessPayload = AuthUser & { tv: number; typ?: 'access' };
type RefreshPayload = { id: string; tv: number; typ: 'refresh' };

/** Short-lived token sent on every API request. */
export function signAccessToken(user: AuthUser, tokenVersion: number): string {
  const payload: AccessPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
    tv: tokenVersion,
    typ: 'access',
  };
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

/** Long-lived token, exchanged at /auth/refresh for a fresh access token. */
export function signRefreshToken(userId: string, tokenVersion: number): string {
  const payload: RefreshPayload = { id: userId, tv: tokenVersion, typ: 'refresh' };
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

/** Verify an access token. Legacy tokens (no `typ`) are treated as access. */
export function verifyAccessToken(token: string): AuthUser & { tv: number } {
  const decoded = jwt.verify(token, env.jwtSecret) as AccessPayload;
  if ((decoded as { typ?: string }).typ === 'refresh') {
    throw new Error('Refresh token cannot be used for authentication');
  }
  return {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    employeeId: decoded.employeeId,
    tv: typeof decoded.tv === 'number' ? decoded.tv : 0,
  };
}

/** Verify a refresh token. */
export function verifyRefreshToken(token: string): { id: string; tv: number } {
  const decoded = jwt.verify(token, env.jwtSecret) as RefreshPayload;
  if (decoded.typ !== 'refresh') throw new Error('Not a refresh token');
  return { id: decoded.id, tv: typeof decoded.tv === 'number' ? decoded.tv : 0 };
}
