import { RevokeMemberButton } from "@/components/revoke-member-button";

interface Member {
  id: string;
  name: string;
  role: string;
}

interface MembersTableProps {
  orgSlug: string;
  members: Member[];
  // The viewer's own membership -- their row gets no revoke button, since
  // removing yourself isn't allowed (the revoke action must enforce this too).
  // Owner rows get none either, since Owners can't be revoked.
  currentMembershipId?: string;
  // Display only -- the revoke action re-checks member:remove server-side.
  canRemove?: boolean;
}

export function MembersTable({
  orgSlug,
  members,
  currentMembershipId,
  canRemove = false,
}: MembersTableProps) {
  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-black/[.08] dark:border-white/[.145]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/[.08] text-zinc-600 dark:border-white/[.145] dark:text-zinc-400">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="w-12 px-4 py-3 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-zinc-600 dark:text-zinc-400">
                No members yet.
              </td>
            </tr>
          ) : (
            members.map((member) => (
              <tr
                key={member.id}
                className="border-b border-black/[.08] last:border-b-0 dark:border-white/[.145]"
              >
                <td className="px-4 py-3 font-medium text-zinc-950 dark:text-zinc-50">
                  {member.name}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{member.role}</td>
                <td className="px-4 py-3">
                  {canRemove && member.id !== currentMembershipId && member.role !== "Owner" && (
                    <RevokeMemberButton
                      orgSlug={orgSlug}
                      membershipId={member.id}
                      memberName={member.name}
                    />
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
