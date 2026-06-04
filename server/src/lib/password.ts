import bcrypt from 'bcryptjs';

// OWASP-aligned work factor for an HR/salary datastore (≈250ms/hash on modern HW).
const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
