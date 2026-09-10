import { getOrganizationMembers, requireMembership } from "@/server/db/organization";
import { verifySession } from "@/server/db/session";
import { CreateProjectForm } from "@/components/create-project-form";

export default async function CreateProject({
  params,
}: PageProps<"/dashboard/[orgSlug]/projects/create">) {
  const session = await verifySession();
  const { orgSlug } = await params;

  await requireMembership(session.userId, orgSlug);
  const members = await getOrganizationMembers(orgSlug);

  return (
    <div className="flex flex-1 justify-center p-8">
      <div className="w-full max-w-sm">
        <CreateProjectForm orgSlug={orgSlug} members={members} />
      </div>
    </div>
  );
}
