import { getTaskStatusOption } from "@/lib/task";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/generated/prisma/client";
import { CyclingTaskRow } from "@/components/marketing/cycling-task-row";

// Static stand-in for the real project page -- same columns and status dots as
// TaskList, with sample data, so the hero shows the product without a screenshot.
const SAMPLE_TASKS: { title: string; assignee: string; status: TaskStatus }[] = [
  { title: "Fix invite expiry check", assignee: "Daniel", status: "IN_REVIEW" },
  { title: "Write onboarding emails", assignee: "Sara", status: "IN_PROGRESS" },
  { title: "Add assignee filter", assignee: "Priya", status: "DONE" },
  { title: "Audit role permissions", assignee: "Unassigned", status: "TODO" },
  { title: "Dark mode for settings", assignee: "Unassigned", status: "BACKLOG" },
];

const SIDEBAR_LINKS = ["Overview", "Projects"];

export function ProductPreview() {
  return (
    <div
      role="img"
      aria-label="Preview of a Mini Linear project, with a task moving from Backlog to Done"
      className="overflow-hidden rounded-xl border border-rule bg-surface text-sm text-ink shadow-[0_1px_0_var(--rule),0_24px_48px_-24px_rgb(22_24_29/0.25)]"
    >
      <div className="flex">
        <div className="hidden w-44 shrink-0 flex-col gap-1 bg-zinc-950 p-3 text-zinc-300 md:flex">
          <span className="px-2 pb-3 font-semibold text-zinc-50">Acme</span>
          {SIDEBAR_LINKS.map((link) => (
            <span
              key={link}
              className={cn("rounded-md px-2 py-1.5", link === "Projects" && "bg-zinc-900 text-zinc-50")}
            >
              {link}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b border-rule px-4 py-3">
            <span className="text-muted">
              Projects <span className="px-1">/</span>
              <span className="text-ink">Website relaunch</span>
            </span>
            <span className="hidden rounded-full bg-ink px-3 py-1 text-xs font-medium text-paper sm:block">
              Add task
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-rule px-4 py-2 text-xs text-muted sm:grid-cols-[1fr_7rem_8.5rem]">
            <span>Title</span>
            <span className="hidden sm:block">Assigned to</span>
            <span>Status</span>
          </div>

          <CyclingTaskRow />

          {SAMPLE_TASKS.map((task) => {
            const option = getTaskStatusOption(task.status);
            return (
              <div
                key={task.title}
                className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-rule px-4 py-3 sm:grid-cols-[1fr_7rem_8.5rem]"
              >
                <span className="truncate">{task.title}</span>
                <span className="hidden text-muted sm:block">{task.assignee}</span>
                <span className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", option.dotColor)} />
                  {option.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
