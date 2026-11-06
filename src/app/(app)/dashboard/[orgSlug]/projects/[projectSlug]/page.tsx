import { notFound } from "next/navigation";
import { verifySession } from "@/server/db/session";
import { getOrganizationMembers, requireMembership } from "@/server/db/organization";
import { findProjectBySlug } from "@/server/db/project";
import { EditProjectForm } from "@/components/edit-project-form";

export default async function ProjectOverviewPage({
  params,
}: PageProps<"/dashboard/[orgSlug]/projects/[projectSlug]">) {
  const session = await verifySession();
  const { orgSlug, projectSlug } = await params;

  // Repeated from the layout on purpose -- a page can render without its
  // layout (see the layout's comment), so it guards its own reads.
  await requireMembership(session.userId, orgSlug);

  // findProjectBySlug is cache()-wrapped, so on a full render this is the
  // same result the layout already fetched -- not a second query.
  const project = await findProjectBySlug(orgSlug, projectSlug);
  if (!project) {
    notFound();
  }

  const members = await getOrganizationMembers(orgSlug);

  return (
    <div className="max-w-sm">
      <EditProjectForm
        orgSlug={orgSlug}
        projectSlug={projectSlug}
        project={project}
        members={members}
      />
    </div>
  );
}
