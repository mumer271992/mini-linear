import "server-only";
import { prisma } from "@/server/db";
import { findOrganizationBySlug } from "@/server/db/organization";

// Pending only -- this backs the Members page's "outstanding invites" list,
// not a historical log. Accepted/revoked rows stay in the table for audit
// purposes but aren't what that UI needs.
export async function getInvitesForOrganization(organizationSlug: string) {
  const organization = await findOrganizationBySlug(organizationSlug);
  if (!organization) {
    throw new Error("Organization not found.");
  }

  return prisma.invite.findMany({
    where: { organizationId: organization.id, status: "PENDING" },
    include: {
      role: { select: { id: true, name: true } },
      invitedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Public-page lookup (the accept-invite page renders for anyone with the
// link, logged in or not) -- deliberately returns the raw row rather than
// interpreting it. Whether it's expired, already accepted, or revoked is a
// judgment the caller makes from `status`/`expiresAt`, same as how
// findProjectBySlug just returns null and leaves "what that means" to the page.
export async function findInviteByToken(token: string) {
  return prisma.invite.findUnique({
    where: { token },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      invitedBy: { select: { id: true, name: true } },
      role: { select: { id: true, name: true } },
    },
  });
}

interface UpsertInviteData {
  organizationId: string;
  email: string;
  roleId: string;
  invitedById: string;
  token: string;
  expiresAt: Date;
}

// One row per org+email (see the @@unique on Invite): re-inviting the same
// address -- including one that was revoked -- refreshes that row with a new
// token, expiry, and inviter and puts it back to PENDING, so any older link
// stops working.
export async function upsertInvite(data: UpsertInviteData) {
  const { organizationId, email, ...fields } = data;

  return prisma.invite.upsert({
    where: { organizationId_email: { organizationId, email } },
    update: { ...fields, status: "PENDING" },
    create: { organizationId, email, ...fields },
  });
}

interface AcceptInviteData {
  inviteId: string;
  userId: string;
  organizationId: string;
  roleId: string;
}

// Returns false (and writes nothing) if the invite stopped being acceptable
// after the caller checked it -- accepted by a concurrent request, revoked,
// or expired in between. The status flip is conditional on PENDING and not
// yet expired, so of two simultaneous accepts only one can match; everything
// else happens in the same transaction, so a failed membership insert (e.g.
// already a member) rolls the status back too.
export async function acceptInvite({ inviteId, userId, organizationId, roleId }: AcceptInviteData) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.invite.updateMany({
      where: { id: inviteId, status: "PENDING", expiresAt: { gt: new Date() } },
      data: { status: "ACCEPTED" },
    });
    if (count === 0) {
      return false;
    }

    await tx.membership.create({
      data: { userId, organizationId, roleId },
    });

    // The token only ever reached this user through an email to this
    // address, so following it proves they control the inbox. Only set it
    // once -- don't overwrite an earlier verification date.
    await tx.user.updateMany({
      where: { id: userId, emailVerifiedAt: null },
      data: { emailVerifiedAt: new Date() },
    });

    return true;
  });
}
