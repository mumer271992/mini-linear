"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTaskStatusOption } from "@/lib/task";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { EditTaskForm } from "@/components/edit-task-form";
import { deleteTask } from "@/server/actions/task";
import type { getTasksForProject } from "@/server/db/task";
import type { Task } from "@/generated/prisma/client";

interface TaskListProps {
  orgSlug: string;
  projectSlug: string;
  tasks: Awaited<ReturnType<typeof getTasksForProject>>;
  members: { id: string; name: string }[];
}

export function TaskList({ orgSlug, projectSlug, tasks, members }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const router = useRouter();

  // Same close-always-refreshes wiring as AddTaskButton: covers Escape,
  // backdrop, close button, and the form's own onUpdated after a successful
  // save, all through this one handler.
  function handleClose() {
    setSelectedTask(null);
    router.refresh();
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) {
      return;
    }

    const result = await deleteTask(orgSlug, projectSlug, task.id);
    if (result?.error) {
      window.alert(result.error);
      return;
    }

    router.refresh();
  }

  if (tasks.length === 0) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">No tasks yet.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-black/[.08] dark:border-white/[.145]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/[.08] text-zinc-600 dark:border-white/[.145] dark:text-zinc-400">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Assigned to</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const status = getTaskStatusOption(task.status);

              return (
                <tr
                  key={task.id}
                  className="border-b border-black/[.08] last:border-b-0 dark:border-white/[.145]"
                >
                  <td className="px-4 py-3 font-medium text-zinc-950 dark:text-zinc-50">
                    {task.title}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {task.assignedTo?.name ?? "Unassigned"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", status.dotColor)} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedTask(task)}
                        aria-label={`Edit ${task.title}`}
                        className="cursor-pointer text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                          <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(task)}
                        aria-label={`Delete ${task.title}`}
                        className="cursor-pointer text-zinc-500 hover:text-red-600"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path
                            fillRule="evenodd"
                            d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedTask && (
        <Modal onClose={handleClose}>
          <EditTaskForm
            orgSlug={orgSlug}
            projectSlug={projectSlug}
            task={selectedTask}
            members={members}
            onUpdated={handleClose}
          />
        </Modal>
      )}
    </>
  );
}
