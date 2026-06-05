// Back up the dev SQLite database to a timestamped copy.
//   npm --prefix server run db:backup
// SQLite is a single file, so a copy is a complete, restorable backup.
// (No-op-safe: if there's no dev.db yet, it exits with a clear message.)
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'dev.db');

if (!existsSync(src)) {
  console.error(`No database found at ${src} — run "npm run db:push" + "npm run seed" first.`);
  process.exit(1);
}

const dir = join(here, 'backups');
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dest = join(dir, `dev-${stamp}.db`);
copyFileSync(src, dest);
console.log(`Backed up database → ${dest}`);
