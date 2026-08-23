import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { findRoleByName } from "@/server/db/role";

export async function findOrganizationBySlug(slug: string) {
  return prisma.organization.findUnique({
    where: { slug },
  });
}

interface CreateOrganizationData {
  name: string;
  slug: string;
  ownerId: string;
}

export async function createOrganizationWithOwner(
  data: CreateOrganizationData,
) {
  const ownerRole = await findRoleByName("Owner");
  if (!ownerRole) {
    throw new Error("Owner role is not seeded.");
  }

  // A nested write: Prisma creates the organization and its first
  // membership in one call, so there's no window where the org exists
  // without an owner if something fails partway through.
  return prisma.organization.create({
    data: {
      name: data.name,
      slug: data.slug,
      memberships: {
        create: {
          userId: data.ownerId,
          roleId: ownerRole.id,
        },
      },
    },
  });
}

export async function getOrganizationsForUser(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  // Ordered oldest membership first, so callers that want a default
  // ("which org did this user join first") can just take the first entry.
  return memberships.map((membership) => membership.organization);
}

export const requireOrganization = cache(async (userId: string) => {
  const organizations = await getOrganizationsForUser(userId);

  if (organizations.length === 0) {
    redirect("/onboarding");
  }

  return organizations;
});
