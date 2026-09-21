import { TaskList } from "@/components/task-list";
import { AddTaskButton } from "@/components/add-task-button";
import { TaskFilters } from "@/components/task-filters";
import { getTasksForProject } from "@/server/db/task";
import type { TaskStatus } from "@/generated/prisma/client";

interface TasksContainerProps {
  orgSlug: string;
  projectSlug: string;
  members: { id: string; name: string }[];
  appliedStatuses: TaskStatus[];
  appliedAssigneeIds: string[];
}

export async function TasksContainer({
  orgSlug,
  projectSlug,
  members,
  appliedStatuses,
  appliedAssigneeIds,
}: TasksContainerProps) {
  const tasks = await getTasksForProject(orgSlug, projectSlug, {
    statuses: appliedStatuses,
    assigneeIds: appliedAssigneeIds,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Tasks</h2>
        <AddTaskButton orgSlug={orgSlug} projectSlug={projectSlug} members={members} />
      </div>
      <TaskFilters
        members={members}
        appliedStatuses={appliedStatuses}
        appliedAssigneeIds={appliedAssigneeIds}
      />
      <TaskList orgSlug={orgSlug} projectSlug={projectSlug} tasks={tasks} members={members} />
    </div>
  );
}
