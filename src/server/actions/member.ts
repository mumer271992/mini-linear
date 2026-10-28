"use server";

import { verifySession } from "@/server/db/session";
import {
  deleteMembership,
  findMembershipInOrganization,
  requireMembership,
  requirePermission,
} from "@/server/db/organization";
import { isRecordNotFoundError } from "@/lib/prisma";
import { OWNER_ROLE_NAME } from "@/lib/organization";

interface MemberErrorResult {
  error: string;
}

// Returns nothing on success -- the caller refreshes the page, same as
// deleteTask. The UI hides the button for the viewer's own row, for Owner
// rows, and for roles without member:remove, but all three are re-checked
// here since the action can be called directly. Owners can't be revoked at
// all, so one Owner can never push another out of the organization.
export async function revokeMembership(
  organizationSlug: string,
  membershipId: string,
): Promise<MemberErrorResult | void> {
  const session = await verifySession();
  const membership = await requireMembership(session.userId, organizationSlug);
  requirePermission(membership, "member:remove");

  if (membershipId === membership.id) {
    return { error: "You can't remove yourself from the organization." };
  }

  const target = await findMembershipInOrganization(membership.organizationId, membershipId);
  if (!target) {
    return { error: "This member has already been removed." };
  }
  if (target.role.name === OWNER_ROLE_NAME) {
    return { error: "Owners can't be removed from the organization." };
  }

  try {
    await deleteMembership(membership.organizationId, membershipId);
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return { error: "This member has already been removed." };
    }

    console.error(error);
    return { error: "Something went wrong. Please try again." };
  }
}
