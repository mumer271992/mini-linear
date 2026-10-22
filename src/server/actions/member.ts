"use server";

import { verifySession } from "@/server/db/session";
import {
  deleteMembership,
  requireMembership,
  requirePermission,
} from "@/server/db/organization";
import { isRecordNotFoundError } from "@/lib/prisma";

interface MemberErrorResult {
  error: string;
}

// Returns nothing on success -- the caller refreshes the page, same as
// deleteTask. The UI hides the button for the viewer's own row and for roles
// without member:remove, but both are re-checked here since the action can
// be called directly.
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

  try {
    await deleteMembership(organizationSlug, membershipId);
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return { error: "This member has already been removed." };
    }

    console.error(error);
    return { error: "Something went wrong. Please try again." };
  }
}
