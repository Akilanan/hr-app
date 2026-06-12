import dotenv from 'dotenv';

// quiet: dotenv 17 logs an "injecting env" banner by default — noise in Render logs.
dotenv.config({ quiet: true });

function get(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProd = nodeEnv === 'production';

const DEV_SECRET_FALLBACK = 'dev-only-insecure-secret-change-me';

function resolveJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (isProd) {
    if (!s || s.length < 32 || s === DEV_SECRET_FALLBACK) {
      throw new Error(
        'JWT_SECRET must be set to a strong value (32+ chars) in production. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"',
      );
    }
    return s;
  }
  const secret = s ?? DEV_SECRET_FALLBACK;
  if (!s || s.length < 32 || s === DEV_SECRET_FALLBACK) {
    console.warn(
      '[security] Weak or fallback JWT_SECRET in use — set a strong JWT_SECRET (32+ chars) before any non-local deployment.',
    );
  }
  return secret;
}

export const env = {
  databaseUrl: get('DATABASE_URL', 'file:./dev.db'),
  jwtSecret: resolveJwtSecret(),
  // Short access token + long refresh token. JWT_EXPIRES_IN is still honored as a
  // fallback for the access TTL so older .env files keep working.
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? process.env.JWT_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  port: Number.parseInt(process.env.PORT ?? '4000', 10),
  // The app's public origin (single-origin in prod). On Render this auto-resolves from
  // RENDER_EXTERNAL_URL, so no manual config is needed there.
  clientOrigin: process.env.CLIENT_ORIGIN ?? process.env.RENDER_EXTERNAL_URL ?? 'http://localhost:5173',
  // Set ENABLE_HTTPS=true ONLY when the app is reachable over HTTPS (e.g. behind a
  // TLS reverse proxy). It gates the HSTS header — sending HSTS while serving plain
  // HTTP on a LAN would force browsers to HTTPS and lock users out.
  httpsEnabled: (process.env.ENABLE_HTTPS ?? 'false').toLowerCase() === 'true',
  // In production the API also serves the built web app. Defaults to ../../client/dist
  // relative to the compiled server; override if you deploy the web build elsewhere.
  clientDistPath: process.env.CLIENT_DIST_PATH ?? '',
  nodeEnv,
  isProd,
};
