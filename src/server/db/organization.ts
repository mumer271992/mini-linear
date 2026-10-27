import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { findRoleByName } from "@/server/db/role";
import { normalizeString } from "@/lib/string";

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

// Separate from getOrganizationMembers (which feeds assignee pickers and only
// needs users) -- the members page lists memberships, so `id` is the
// membership id: revoking access deletes the membership, not the user.
export const getOrganizationMembersWithRoles = cache(async (organizationSlug: string) => {
  const organization = await findOrganizationBySlug(organizationSlug);
  if (!organization) {
    throw new Error("Organization not found.");
  }

  const memberships = await prisma.membership.findMany({
    where: { organizationId: organization.id },
    include: {
      user: { select: { name: true } },
      role: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((membership) => ({
    id: membership.id,
    name: membership.user.name,
    role: membership.role.name,
  }));
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

// Same idea as isOrganizationMember, but keyed by email -- for invites, where
// the person being added may or may not have an account yet.
export async function isEmailOrganizationMember(
  email: string,
  organizationSlug: string,
) {
  const organization = await findOrganizationBySlug(organizationSlug);
  if (!organization) {
    return false;
  }

  const membership = await prisma.membership.findFirst({
    where: {
      organizationId: organization.id,
      user: { email: normalizeString(email) },
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

// Scoped by organization as well as id, so a membership id belonging to some
// other org reads as missing rather than leaking that org's member.
export async function findMembershipInOrganization(organizationId: string, membershipId: string) {
  return prisma.membership.findUnique({
    where: { id: membershipId, organizationId },
    include: { role: true },
  });
}

// Scoped by organization as well as id, so a membership id belonging to some
// other org can't be deleted through this org. Owner memberships are
// excluded too, so a role change racing the caller's own check still can't
// remove an Owner. Throws P2025 if no matching row exists.
// Also clears the user's task and project assignments in this org, in the
// same transaction, so a revoke never leaves work assigned to someone who can
// no longer see it. Their assignments in other orgs are untouched.
export async function deleteMembership(organizationId: string, membershipId: string) {
  return prisma.$transaction(async (tx) => {
    // Delete first: a P2025 here rolls the transaction back before anything
    // is unassigned.
    const membership = await tx.membership.delete({
      where: {
        id: membershipId,
        organizationId,
        role: { name: { not: "Owner" } },
      },
    });

    await tx.task.updateMany({
      where: { assignedToId: membership.userId, project: { organizationId } },
      data: { assignedToId: null },
    });
    await tx.project.updateMany({
      where: { assignedToId: membership.userId, organizationId },
      data: { assignedToId: null },
    });

    return membership;
  });
}

// Non-throwing check, for UI that should only render for some roles (e.g.
// hiding an invite button). Actions still go through requirePermission.
export function hasPermission(
  membership: Awaited<ReturnType<typeof requireMembership>>,
  permission: string,
) {
  const permissions = Array.isArray(membership.role.permissions)
    ? membership.role.permissions
    : [];

  return permissions.includes(permission);
}

// Membership alone only proves the user belongs to the organization -- this
// checks whether their specific role is actually allowed to do this action.
export function requirePermission(
  membership: Awaited<ReturnType<typeof requireMembership>>,
  permission: string,
) {
  if (!hasPermission(membership, permission)) {
    throw new Error("You do not have permission to perform this action.");
  }
}
