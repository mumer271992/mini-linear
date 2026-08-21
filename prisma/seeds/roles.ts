import type { PrismaClient } from "../../src/generated/prisma/client";

const roles = [
  {
    name: "Owner",
    permissions: [
      "organization:create",
      "organization:read",
      "organization:update",
      "organization:delete",
      "project:create",
      "project:read",
      "project:update",
      "project:delete",
      "task:create",
      "task:read",
      "task:update",
      "task:delete",
    ],
  },
  {
    name: "Member",
    permissions: [
      "organization:read",
      "project:create",
      "project:read",
      "project:update",
      "project:delete",
      "task:create",
      "task:read",
      "task:update",
      "task:delete",
    ],
  },
];

export async function seedRoles(prisma: PrismaClient) {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { permissions: role.permissions },
      create: role,
    });
  }
}
