/**
 * Bootstrap the first ADMIN account on a clean (freshly-created) database.
 *
 * Usage (from /server, with the production .env in place):
 *   $env:ADMIN_EMAIL="you@company.com"        # PowerShell
 *   $env:ADMIN_PASSWORD="a-strong-password"   # optional — omit to auto-generate one
 *   npm run create-admin
 *
 * Or pass them as arguments:
 *   npm run create-admin -- you@company.com a-strong-password
 *
 * Safe to re-run: if the email already exists it is promoted to ADMIN, re-activated,
 * its password reset, and existing sessions revoked. The admin must set their own
 * password at first sign-in (unless ADMIN_FORCE_CHANGE=false).
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

function generatePassword(len = 16): string {
  // No visually ambiguous characters (no O/0/I/l/1).
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*?';
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? process.argv[2] ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    console.error('✗ Provide an admin email via ADMIN_EMAIL or as the first argument.');
    console.error('  Example (PowerShell):  $env:ADMIN_EMAIL="you@company.com"; npm run create-admin');
    process.exit(1);
  }

  const provided = process.env.ADMIN_PASSWORD ?? process.argv[3];
  if (provided && provided.length < 8) {
    console.error('✗ ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }
  const password = provided || generatePassword();
  const passwordHash = bcrypt.hashSync(password, 10);
  const forceChange = (process.env.ADMIN_FORCE_CHANGE ?? 'true').toLowerCase() !== 'false';

  const existed = await prisma.user.findUnique({ where: { email } });
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      isActive: true,
      passwordHash,
      tokenVersion: { increment: 1 }, // revoke any live sessions on the old password
      mustChangePassword: forceChange,
    },
    create: { email, role: 'ADMIN', passwordHash, mustChangePassword: forceChange },
  });

  console.log(`\n✓ Admin ${existed ? 'updated' : 'created'}`);
  console.log(`  Email:    ${user.email}`);
  console.log(`  Password: ${provided ? '(the one you provided)' : password}`);
  if (!provided) console.log('            ↑ save this now — it is not stored anywhere and won’t be shown again');
  if (forceChange) console.log('  Note:     you will be required to set a new password at first sign-in.');
  console.log('');
}

main()
  .catch((e) => {
    console.error('create-admin failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
