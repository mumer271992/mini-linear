import { TaskList } from "@/components/task-list";
import { AddTaskButton } from "@/components/add-task-button";
import { getTasksForProject } from "@/server/db/task";

interface TasksContainerProps {
  orgSlug: string;
  projectSlug: string;
  members: { id: string; name: string }[];
}

export async function TasksContainer({ orgSlug, projectSlug, members }: TasksContainerProps) {
  const tasks = await getTasksForProject(orgSlug, projectSlug);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Tasks</h2>
        <AddTaskButton orgSlug={orgSlug} projectSlug={projectSlug} members={members} />
      </div>
      <TaskList orgSlug={orgSlug} projectSlug={projectSlug} tasks={tasks} members={members} />
    </div>
  );
}
