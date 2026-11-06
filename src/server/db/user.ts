import { prisma } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { normalizeString } from "@/lib/string";

export async function findUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: {
      email: normalizeString(email),
    },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

interface UserData {
  name: string;
  email: string;
  passwordHash: string;
}

export async function createUserWithEmail(userData: UserData) {
  return prisma.user.create({
    data: {
      ...userData,
      email: normalizeString(userData.email),
    },
  });
}

// Only sets it once -- re-following an old link (or accepting an invite
// after verifying) must not overwrite the original verification date.
// The single home for this rule: both the verification link and invite
// acceptance call it. Pass `db` to run it inside a caller's transaction.
export async function markEmailVerified(
  userId: string,
  db: Prisma.TransactionClient = prisma,
) {
  return db.user.updateMany({
    where: { id: userId, emailVerifiedAt: null },
    data: { emailVerifiedAt: new Date() },
  });
}

// Starts a verification-email cooldown, atomically: one conditional UPDATE,
// so of several simultaneous requests only one can match and the rest see
// the timestamp it just wrote. Returns false (and sends nothing, at the
// caller) while the last email is younger than `cooldownMs`, or once the
// user is verified.
export async function claimVerificationEmailSlot(userId: string, cooldownMs: number) {
  const now = new Date();

  const { count } = await prisma.user.updateMany({
    where: {
      id: userId,
      emailVerifiedAt: null,
      OR: [
        { verificationEmailSentAt: null },
        { verificationEmailSentAt: { lte: new Date(now.getTime() - cooldownMs) } },
      ],
    },
    data: { verificationEmailSentAt: now },
  });

  return count === 1;
}

