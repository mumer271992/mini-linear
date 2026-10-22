"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { verifySession } from "@/server/db/session";
import {
  findOrganizationBySlug,
  isEmailOrganizationMember,
  isOrganizationMember,
  requireMembership,
  requirePermission,
} from "@/server/db/organization";
import { findRoleByName } from "@/server/db/role";
import { findUserById } from "@/server/db/user";
import {
  acceptInvite as acceptInviteRecord,
  findInviteByToken,
  upsertInvite,
} from "@/server/db/invite";
import { sendInviteEmail } from "@/lib/email";
import { normalizeString } from "@/lib/string";
import { isUniqueConstraintError } from "@/lib/prisma";

// Demo scope: every invite grants the same role, so the form only asks for
// an email. Swap this for a roleId from the form if role choice comes back.
const INVITE_ROLE_NAME = "Member";
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const emailSchema = z.email();

interface InviteMemberRequest {
  email: string;
}

interface InviteErrorResult {
  error: string;
}

export async function inviteMember(
  organizationSlug: string,
  formData: InviteMemberRequest,
): Promise<{ invite: { id: string; email: string } } | InviteErrorResult> {
  const session = await verifySession();
  const membership = await requireMembership(session.userId, organizationSlug);
  requirePermission(membership, "member:invite");

  const parsedEmail = emailSchema.safeParse(normalizeString(formData.email ?? ""));
  if (!parsedEmail.success) {
    return { error: "Enter a valid email address." };
  }
  const email = parsedEmail.data;

  if (await isEmailOrganizationMember(email, organizationSlug)) {
    return { error: "This person is already a member of this organization." };
  }

  try {
    const appUrl = process.env.APP_URL;
    if (!appUrl) {
      throw new Error("APP_URL environment variable is not set");
    }

    const [organization, inviter, role] = await Promise.all([
      findOrganizationBySlug(organizationSlug),
      findUserById(session.userId),
      findRoleByName(INVITE_ROLE_NAME),
    ]);
    if (!organization || !inviter || !role) {
      throw new Error("Missing organization, inviter, or invite role.");
    }

    const token = randomBytes(32).toString("base64url");
    const invite = await upsertInvite({
      organizationId: organization.id,
      email,
      roleId: role.id,
      invitedById: inviter.id,
      token,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    });

    // If sending fails the row is still saved as PENDING; retrying the
    // invite regenerates the token, so nothing is left half-usable.
    await sendInviteEmail({
      to: email,
      organizationName: organization.name,
      inviterName: inviter.name,
      acceptUrl: new URL(`/invite/${token}`, appUrl).toString(),
    });

    return { invite: { id: invite.id, email: invite.email } };
  } catch (error) {
    console.error(error);
    return { error: "Something went wrong. Please try again." };
  }
}

// Every check here is re-done server-side even though the accept page shows
// the same states -- the page is only display; this is what actually guards
// the membership. On success it redirects into the organization, so the only
// thing it ever returns is an error.
export async function acceptInvite(token: string): Promise<InviteErrorResult> {
  const session = await verifySession();

  const invite = await findInviteByToken(token);
  if (!invite || invite.status !== "PENDING") {
    return { error: "This invite link isn't valid." };
  }

  if (invite.expiresAt <= new Date()) {
    return {
      error: `This invite has expired. Ask ${invite.invitedBy.name} to send a new one.`,
    };
  }

  // Strict match: the invite is for one specific address, and only the
  // account with that email can use it -- holding the link isn't enough.
  const user = await findUserById(session.userId);
  if (!user || normalizeString(user.email) !== normalizeString(invite.email)) {
    return { error: "This invite was sent to a different email address." };
  }

  if (await isOrganizationMember(user.id, invite.organization.slug)) {
    return { error: `You're already a member of ${invite.organization.name}.` };
  }

  let accepted;
  try {
    accepted = await acceptInviteRecord({
      inviteId: invite.id,
      userId: user.id,
      organizationId: invite.organization.id,
      roleId: invite.roleId,
    });
  } catch (error) {
    // A concurrent request created the membership between the check above
    // and the transaction; the memberships unique constraint caught it.
    if (isUniqueConstraintError(error)) {
      return { error: `You're already a member of ${invite.organization.name}.` };
    }

    console.error(error);
    return { error: "Something went wrong. Please try again." };
  }

  // Raced with another accept, a revoke, or the expiry boundary.
  if (!accepted) {
    return { error: "This invite link isn't valid." };
  }

  redirect(`/dashboard/${invite.organization.slug}`);
}
