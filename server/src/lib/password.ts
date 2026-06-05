import bcrypt from 'bcryptjs';

// OWASP-aligned work factor for an HR/salary datastore (≈250ms/hash on modern HW).
const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// A valid bcrypt hash (same work factor) to compare against when an account
// doesn't exist or is inactive, so login takes the same time regardless and
// can't be used to enumerate which emails are registered. Computed once at boot.
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync('unused-placeholder-password', SALT_ROUNDS);
