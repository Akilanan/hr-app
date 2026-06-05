import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthUser } from '../types';

// `tv` (token version) is embedded so a token can be revoked server-side by
// bumping the user's tokenVersion (logout / password change / admin reset).
type JwtPayload = AuthUser & { tv: number };

export function signToken(user: AuthUser, tokenVersion: number): string {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
    tv: tokenVersion,
  };
  const options: jwt.SignOptions = {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string): AuthUser & { tv: number } {
  const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
  return {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    employeeId: decoded.employeeId,
    tv: typeof decoded.tv === 'number' ? decoded.tv : 0,
  };
}
