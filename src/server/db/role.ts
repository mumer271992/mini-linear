import { prisma } from "@/server/db";

export async function findRoleByName(name: string) {
  return prisma.role.findUnique({
    where: { name },
  });
}
