import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/** Sets common security headers (dependency-free; covers what helmet would for a JSON API). */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.removeHeader('X-Powered-By');
  // Only advertise HSTS when actually served over HTTPS — otherwise browsers would
  // force HTTPS on a plain-HTTP LAN host and lock everyone out.
  if (env.httpsEnabled) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}
