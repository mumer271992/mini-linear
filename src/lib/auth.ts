import "server-only";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;
const MAX_PASSWORD_LENGTH = 72; // bcrypt silently truncates anything past 72 bytes

export async function generatePasswordHash(password: string) {
  if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_LENGTH) {
    throw new Error(`Password must be at most ${MAX_PASSWORD_LENGTH} bytes.`);
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPasswordHash(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
