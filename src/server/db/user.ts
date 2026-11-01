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
