import { getTaskStatusCounts, getTasksAssignedToUser } from "@/server/db/task";
import { MyTasksTable } from "@/components/my-tasks-table";

interface MyTasksListProps {
  orgSlug: string;
  userId: string;
}

export async function MyTasksList({ orgSlug, userId }: MyTasksListProps) {
  const [tasks, counts] = await Promise.all([
    getTasksAssignedToUser(orgSlug, userId),
    getTaskStatusCounts(orgSlug, userId),
  ]);

  return <MyTasksTable orgSlug={orgSlug} initialTasks={tasks} counts={counts} />;
}
