import { prisma } from "@/server/db";
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
