import type { TaskStatus } from "@/generated/prisma/client";

interface TaskStatusOption {
  value: TaskStatus;
  label: string;
  dotColor: string;
}

// Order here is the display order everywhere these are listed -- dropdowns,
// legends, etc.
export const TASK_STATUS_OPTIONS: TaskStatusOption[] = [
  { value: "BACKLOG", label: "Backlog", dotColor: "bg-zinc-400" },
  { value: "TODO", label: "Todo", dotColor: "bg-blue-500" },
  { value: "IN_PROGRESS", label: "In Progress", dotColor: "bg-amber-400" },
  { value: "IN_REVIEW", label: "In Review", dotColor: "bg-purple-500" },
  { value: "DONE", label: "Done", dotColor: "bg-green-500" },
  { value: "CANCELLED", label: "Cancelled", dotColor: "bg-red-500" },
];

export function getTaskStatusOption(value: TaskStatus) {
  // Non-null: value is typed as TaskStatus, so it can only ever be one of
  // the values already listed above -- the lookup can't actually miss.
  return TASK_STATUS_OPTIONS.find((option) => option.value === value)!;
}

// Not a real TaskStatus/user id -- a sentinel the Assignee filter uses to
// mean "tasks with no assignee," shared between the filter UI, the URL
// param parsing, and the DB query that turns it into `assignedToId: null`.
export const UNASSIGNED_FILTER_VALUE = "unassigned";

// Query params are comma-joined (e.g. ?status=BACKLOG,TODO). Next.js hands
// back a string normally, or a string[] if the param key was repeated --
// handle both rather than assuming the single-value case.
export function parseTaskFilterParam(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw.split(",").filter(Boolean);
}
