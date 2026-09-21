import { notFound } from "next/navigation";
import { verifySession } from "@/server/db/session";
import { getOrganizationMembers, requireMembership } from "@/server/db/organization";
import { findProjectBySlug } from "@/server/db/project";
import { ProjectDetailTabs } from "@/components/project-detail-tabs";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default async function ProjectDetailsPage({
  params,
}: PageProps<"/dashboard/[orgSlug]/projects/[projectSlug]">) {
  const session = await verifySession();
  const { orgSlug, projectSlug } = await params;

  await requireMembership(session.userId, orgSlug);

  const project = await findProjectBySlug(orgSlug, projectSlug);
  if (!project) {
    notFound();
  }

  const members = await getOrganizationMembers(orgSlug);

  return (
    <div className="flex flex-1 flex-col p-8">
      <Breadcrumb
        items={[
          { label: "Projects", href: `/dashboard/${orgSlug}/projects` },
          { label: project.name },
        ]}
        className="mb-2"
      />
      <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
      <ProjectDetailTabs
        orgSlug={orgSlug}
        projectSlug={projectSlug}
        project={project}
        members={members}
      />
    </div>
  );
}
