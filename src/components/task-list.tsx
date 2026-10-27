"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/20/solid";
import { toast } from "sonner";
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

    // Thrown errors (e.g. the caller lost their membership or permission since
    // the page loaded) are caught too, so they surface instead of going unhandled.
    let result: Awaited<ReturnType<typeof deleteTask>>;
    try {
      result = await deleteTask(orgSlug, projectSlug, task.id);
    } catch {
      toast.error("Couldn't delete this task. Refresh the page and try again.");
      return;
    }

    if (result?.error) {
      toast.error(result.error);
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
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(task)}
                        aria-label={`Delete ${task.title}`}
                        className="cursor-pointer text-zinc-500 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
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
