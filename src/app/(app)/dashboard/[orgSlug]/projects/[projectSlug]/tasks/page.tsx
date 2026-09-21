import { getOrganizationMembers } from "@/server/db/organization";
import { TasksContainer } from "@/components/tasks-container";

export default async function ProjectTasksPage({
  params,
}: PageProps<"/dashboard/[orgSlug]/projects/[projectSlug]/tasks">) {
  const { orgSlug, projectSlug } = await params;

  const members = await getOrganizationMembers(orgSlug);

  return <TasksContainer orgSlug={orgSlug} projectSlug={projectSlug} members={members} />;
}
