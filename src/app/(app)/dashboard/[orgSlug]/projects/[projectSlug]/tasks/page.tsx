import { getOrganizationMembers } from "@/server/db/organization";
import { TasksContainer } from "@/components/tasks-container";
import { TASK_STATUS_OPTIONS, parseTaskFilterParam } from "@/lib/task";
import type { TaskStatus } from "@/generated/prisma/client";

const VALID_STATUSES = new Set<string>(TASK_STATUS_OPTIONS.map((option) => option.value));

export default async function ProjectTasksPage({
  params,
  searchParams,
}: PageProps<"/dashboard/[orgSlug]/projects/[projectSlug]/tasks">) {
  const { orgSlug, projectSlug } = await params;
  const resolvedSearchParams = await searchParams;

  const members = await getOrganizationMembers(orgSlug);

  // Query params are user input -- discard anything that isn't a real
  // TaskStatus rather than passing it straight to Prisma, since the status
  // column is a native Postgres enum and an unrecognized value would 500
  // the page instead of just being ignored.
  const appliedStatuses = parseTaskFilterParam(resolvedSearchParams.status).filter(
    (value): value is TaskStatus => VALID_STATUSES.has(value),
  );
  const appliedAssigneeIds = parseTaskFilterParam(resolvedSearchParams.assignee);

  return (
    <TasksContainer
      orgSlug={orgSlug}
      projectSlug={projectSlug}
      members={members}
      appliedStatuses={appliedStatuses}
      appliedAssigneeIds={appliedAssigneeIds}
    />
  );
}