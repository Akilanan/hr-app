import dotenv from 'dotenv';

dotenv.config();

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
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  port: Number.parseInt(process.env.PORT ?? '4000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  nodeEnv,
  isProd,
};
