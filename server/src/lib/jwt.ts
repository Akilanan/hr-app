import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthUser } from '../types';

type JwtPayload = AuthUser;

export function signToken(user: AuthUser): string {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
  };
  const options: jwt.SignOptions = {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string): AuthUser {
  const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
  return {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    employeeId: decoded.employeeId,
  };
}
