import { notFound } from "next/navigation";
import { verifySession } from "@/server/db/session";
import {
  getOrganizationMembersWithRoles,
  hasPermission,
  requireMembership,
} from "@/server/db/organization";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { MembersTable } from "@/components/members-table";
import { InviteMemberButton } from "@/components/invite-member-button";

export default async function MembersPage({
  params,
}: PageProps<"/dashboard/[orgSlug]/members">) {
  const session = await verifySession();
  const { orgSlug } = await params;

  // Membership check first, so non-members never get the member list.
  const membership = await requireMembership(session.userId, orgSlug);
  // 404 rather than "forbidden" -- roles without member:read shouldn't learn
  // the page exists. The sidebar hides the link for them too.
  if (!hasPermission(membership, "member:read")) {
    notFound();
  }
  const members = await getOrganizationMembersWithRoles(orgSlug);

  return (
    <div className="flex flex-1 flex-col p-8">
      <Breadcrumb items={[{ label: "Members" }]} className="mb-2" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        {/* Hidden for roles that can't invite; inviteMember enforces it again server-side. */}
        {hasPermission(membership, "member:invite") && <InviteMemberButton orgSlug={orgSlug} />}
      </div>

      <MembersTable
        orgSlug={orgSlug}
        members={members}
        currentMembershipId={membership.id}
        canRemove={hasPermission(membership, "member:remove")}
      />
    </div>
  );
}
