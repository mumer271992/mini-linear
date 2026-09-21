import { notFound } from "next/navigation";
import { verifySession } from "@/server/db/session";
import { requireMembership } from "@/server/db/organization";
import { findProjectBySlug } from "@/server/db/project";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProjectTabNav } from "@/components/project-tab-nav";

export default async function ProjectDetailLayout({
  params,
  children,
}: LayoutProps<"/dashboard/[orgSlug]/projects/[projectSlug]">) {
  const session = await verifySession();
  const { orgSlug, projectSlug } = await params;

  // Runs once per request and gates the whole subtree -- nested pages don't
  // need to repeat this, since Next.js never renders them if this throws.
  await requireMembership(session.userId, orgSlug);

  const project = await findProjectBySlug(orgSlug, projectSlug);
  if (!project) {
    notFound();
  }

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

      <ProjectTabNav orgSlug={orgSlug} projectSlug={projectSlug} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
