"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getTaskStatusOption } from "@/lib/task";
import { cn } from "@/lib/utils";
import { getMyTasks } from "@/server/actions/task";
import type { getTasksAssignedToUser, TaskStatusCounts } from "@/server/db/task";
import type { TaskStatus } from "@/generated/prisma/client";

type MyTask = Awaited<ReturnType<typeof getTasksAssignedToUser>>[number];

interface MyTasksTableProps {
  orgSlug: string;
  initialTasks: MyTask[];
  counts: TaskStatusCounts;
}

const CANNED_FILTERS: (keyof TaskStatusCounts)[] = ["TODO", "IN_PROGRESS", "DONE"];

// Each pill calls the getMyTasks Server Action directly and swaps the
// fetched rows into state -- a real BE round-trip per filter, not an array
// filter over already-loaded data, and no URL/navigation involved (see the
// comment on getMyTasks for why: appending filter state to the org home
// page's URL read as odd, and avoiding navigation altogether sidesteps the
// router.push reliability issue hit on the per-project Tasks page).
//
// totalCount/counts come from the initial unfiltered fetch and stay fixed
// across filter changes -- they describe "how many tasks exist in each
// status", not "how many are currently shown".
export function MyTasksTable({ orgSlug, initialTasks, counts }: MyTasksTableProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeFilter, setActiveFilter] = useState<TaskStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalCount = initialTasks.length;

  function selectFilter(status: TaskStatus | null) {
    setActiveFilter(status);
    startTransition(async () => {
      const result = await getMyTasks(orgSlug, status ?? undefined);
      setTasks(result);
    });
  }

  const pillClass = (isActive: boolean) =>
    cn(
      "cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
      isActive
        ? "border-zinc-950 bg-zinc-950 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
        : "border-black/[.08] text-zinc-600 hover:border-zinc-950 dark:border-white/[.145] dark:text-zinc-400 dark:hover:border-zinc-50",
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight">My Tasks</h2>

        {totalCount > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => selectFilter(null)}
              className={pillClass(activeFilter === null)}
            >
              All ({totalCount})
            </button>

            {CANNED_FILTERS.map((status) => {
              const option = getTaskStatusOption(status);

              return (
                <button
                  key={status}
                  type="button"
                  disabled={isPending}
                  onClick={() => selectFilter(status)}
                  className={pillClass(activeFilter === status)}
                >
                  {option.label} ({counts[status]})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {totalCount === 0 ? "No tasks assigned to you yet." : "No tasks match this filter."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/[.08] dark:border-white/[.145]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/[.08] text-zinc-600 dark:border-white/[.145] dark:text-zinc-400">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Status</th>
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
                      <Link
                        href={`/dashboard/${orgSlug}/projects/${task.project.slug}/tasks`}
                        className="hover:underline"
                      >
                        {task.project.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", status.dotColor)} />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
