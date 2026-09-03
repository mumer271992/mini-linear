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

// Guards against a logged-in user reaching another organization's data just
// by knowing or guessing its slug -- being authenticated only proves who you
// are, not that you belong to the organization the request is scoped to.
export async function requireMembership(
  userId: string,
  organizationSlug: string,
) {
  const organization = await findOrganizationBySlug(organizationSlug);
  if (!organization) {
    throw new Error("Organization not found.");
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: organization.id,
      },
    },
    include: { role: true },
  });

  if (!membership) {
    throw new Error("You are not a member of this organization.");
  }

  return membership;
}

// Membership alone only proves the user belongs to the organization -- this
// checks whether their specific role is actually allowed to do this action.
export function requirePermission(
  membership: Awaited<ReturnType<typeof requireMembership>>,
  permission: string,
) {
  const permissions = Array.isArray(membership.role.permissions)
    ? membership.role.permissions
    : [];

  if (!permissions.includes(permission)) {
    throw new Error("You do not have permission to perform this action.");
  }
}
