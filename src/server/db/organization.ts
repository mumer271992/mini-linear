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

// cache()-wrapped for the same reason as findProjectBySlug -- multiple
// Server Components within one request (a layout and its nested pages) each
// need this independently, and this dedupes them to a single query.
export const getOrganizationMembers = cache(async (organizationSlug: string) => {
  const organization = await findOrganizationBySlug(organizationSlug);
  if (!organization) {
    throw new Error("Organization not found.");
  }

  const memberships = await prisma.membership.findMany({
    where: { organizationId: organization.id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((membership) => membership.user);
});

// For validating a *target* user (e.g. an assignee picked from a dropdown),
// as opposed to requireMembership which checks the acting/session user and
// throws -- this returns a boolean so callers can surface a normal
// validation error instead of a hard failure.
export async function isOrganizationMember(
  userId: string,
  organizationSlug: string,
) {
  const organization = await findOrganizationBySlug(organizationSlug);
  if (!organization) {
    return false;
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: organization.id,
      },
    },
  });

  return membership !== null;
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
// cache()-wrapped so multiple callers within the same request (a page and
// something it renders, say) share one query instead of duplicating it --
// this does NOT mean the check is skipped on subsequent navigations, since
// each navigation is its own request and gets a fresh cache.
export const requireMembership = cache(
  async (userId: string, organizationSlug: string) => {
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
  },
);

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
