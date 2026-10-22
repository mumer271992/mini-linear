import { notFound } from "next/navigation";
import { getOrganizationMembers } from "@/server/db/organization";
import { findProjectBySlug } from "@/server/db/project";
import { EditProjectForm } from "@/components/edit-project-form";

export default async function ProjectOverviewPage({
  params,
}: PageProps<"/dashboard/[orgSlug]/projects/[projectSlug]">) {
  const { orgSlug, projectSlug } = await params;

  // findProjectBySlug is cache()-wrapped, so this is the same request-scoped
  // result the layout already fetched -- not a second query. The null check
  // is only here for TypeScript to narrow the type; the layout's own check
  // already guarantees this can't actually be null.
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
