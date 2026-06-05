/**
 * Idempotent first-admin bootstrap for cloud deploys (e.g. Render free tier, where
 * there's no shell to run create-admin manually). Runs during the build:
 *   - If any ADMIN already exists → does nothing (re-deploys never reset accounts).
 *   - Else, if ADMIN_EMAIL is set → creates that admin with ADMIN_PASSWORD (or a
 *     generated one printed to the build log) and forces a password change at first login.
 *   - Else → skips gracefully (never fails the build) with instructions.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

function generatePassword(len = 16): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*?';
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const provided = process.env.ADMIN_PASSWORD;
  const reset = ['1', 'true', 'yes', 'on'].includes((process.env.ADMIN_RESET ?? '').toLowerCase());

  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (adminCount > 0) {
    // Recovery path: force the admin's password to ADMIN_PASSWORD when ADMIN_RESET=true
    // (e.g. you lost the generated password). Remove ADMIN_RESET afterwards.
    if (reset && provided && provided.length >= 8) {
      const target =
        (email ? await prisma.user.findFirst({ where: { email, role: 'ADMIN' } }) : null) ??
        (await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } }));
      if (!target) {
        console.warn('[ensure-admin] ADMIN_RESET set but no admin found.');
        return;
      }
      // Normalize the login email to ADMIN_EMAIL too, if set and not already taken.
      const emailFree = !!email && email !== target.email && !(await prisma.user.findUnique({ where: { email } }));
      const updated = await prisma.user.update({
        where: { id: target.id },
        data: {
          ...(emailFree ? { email } : {}),
          passwordHash: bcrypt.hashSync(provided, 10),
          isActive: true,
          mustChangePassword: false, // sign in directly with the new password
          tokenVersion: { increment: 1 },
        },
      });
      console.log(`[ensure-admin] ADMIN_RESET: password reset — sign in as ${updated.email}.`);
    } else {
      console.log(`[ensure-admin] ${adminCount} admin(s) already exist — nothing to do.`);
    }
    return;
  }

  // First boot: create the admin (requires ADMIN_EMAIL).
  if (!email || !email.includes('@')) {
    console.warn('[ensure-admin] No admin yet, and ADMIN_EMAIL is not set — skipping bootstrap.');
    console.warn('  → Set ADMIN_EMAIL (and optionally ADMIN_PASSWORD) in the service env, then redeploy.');
    return;
  }

  const password = provided && provided.length >= 8 ? provided : generatePassword();
  const passwordHash = bcrypt.hashSync(password, 10);

  await prisma.user.create({
    data: { email, role: 'ADMIN', passwordHash, mustChangePassword: true },
  });

  console.log('\n========================================');
  console.log('[ensure-admin] First admin created.');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${provided ? '(the ADMIN_PASSWORD you set)' : password}`);
  if (!provided) console.log('  ^^ SAVE THIS NOW — shown only here. You must change it at first sign-in.');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('[ensure-admin] failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
