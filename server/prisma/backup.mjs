// Back up the SQLite database to a timestamped copy.
//   npm --prefix server run db:backup
//
// Resolves the live DB path from DATABASE_URL (so it works in production, not just
// the dev.db), and copies the WAL/SHM sidecar files too so the snapshot is
// consistent and fully restorable. Schedule this daily (see docs/DEPLOYMENT.md).
import { copyFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)); // .../server/prisma

// DATABASE_URL from the environment, or parsed from server/.env as a fallback.
function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envFile = join(here, '..', '.env');
  if (existsSync(envFile)) {
    const m = readFileSync(envFile, 'utf8').match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (m) return m[1];
  }
  return 'file:./dev.db';
}

const url = databaseUrl();
if (!url.startsWith('file:')) {
  console.error(`This backup script is for SQLite (file:) databases. DATABASE_URL is: ${url}`);
  console.error('For PostgreSQL, use pg_dump or your managed-DB backups instead.');
  process.exit(1);
}

// Prisma resolves relative file: URLs relative to the schema dir (this prisma folder).
let dbPath = url.replace(/^file:/, '');
if (!isAbsolute(dbPath)) dbPath = join(here, dbPath);

if (!existsSync(dbPath)) {
  console.error(`No database found at ${dbPath} — run "npm run db:push" first.`);
  process.exit(1);
}

const dir = process.env.BACKUP_DIR || join(here, 'backups');
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

// Copy the main DB plus its WAL/SHM sidecars (present when WAL mode is on).
let copied = 0;
for (const suffix of ['', '-wal', '-shm']) {
  const src = dbPath + suffix;
  if (existsSync(src)) {
    copyFileSync(src, join(dir, `app-${stamp}.db${suffix}`));
    copied++;
  }
}
console.log(`Backed up ${copied} file(s) → ${join(dir, `app-${stamp}.db`)}`);
