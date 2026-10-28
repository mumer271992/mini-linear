import type { PrismaClient } from "../../src/generated/prisma/client";
import { OWNER_ROLE_NAME } from "../../src/lib/organization";

const roles = [
  {
    name: OWNER_ROLE_NAME,
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
      "member:read",
      "member:invite",
      "member:remove",
      "invite:read",
      "invite:revoke",
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
