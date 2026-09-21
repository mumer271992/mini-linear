import { getOrganizationMembers, requireMembership } from "@/server/db/organization";
import { verifySession } from "@/server/db/session";
import { CreateProjectModal } from "@/components/create-project-modal";

export default async function CreateProjectModalPage({
  params,
}: PageProps<"/dashboard/[orgSlug]/projects/create">) {
  const session = await verifySession();
  const { orgSlug } = await params;

  await requireMembership(session.userId, orgSlug);
  const members = await getOrganizationMembers(orgSlug);

  return <CreateProjectModal orgSlug={orgSlug} members={members} />;
}
