import type { ProjectPriority, ProjectStatus } from "@/generated/prisma/client";

interface ProjectOption<T extends string> {
  value: T;
  label: string;
  dotColor: string;
}

// Order here is the display order everywhere these are listed -- dropdowns,
// legends, etc.
export const PROJECT_PRIORITY_OPTIONS: ProjectOption<ProjectPriority>[] = [
  { value: "URGENT", label: "Urgent", dotColor: "bg-red-500" },
  { value: "HIGH", label: "High", dotColor: "bg-orange-500" },
  { value: "MEDIUM", label: "Medium", dotColor: "bg-amber-400" },
  { value: "LOW", label: "Low", dotColor: "bg-zinc-400" },
];

export const PROJECT_STATUS_OPTIONS: ProjectOption<ProjectStatus>[] = [
  { value: "BACKLOG", label: "Backlog", dotColor: "bg-zinc-400" },
  { value: "PLANNED", label: "Planned", dotColor: "bg-blue-500" },
  { value: "IN_PROGRESS", label: "In Progress", dotColor: "bg-amber-400" },
  { value: "COMPLETED", label: "Completed", dotColor: "bg-green-500" },
  { value: "CANCELLED", label: "Cancelled", dotColor: "bg-red-500" },
];

export function getProjectPriorityOption(value: ProjectPriority) {
  // Non-null: value is typed as ProjectPriority, so it can only ever be one
  // of the values already listed above -- the lookup can't actually miss.
  return PROJECT_PRIORITY_OPTIONS.find((option) => option.value === value)!;
}

export function getProjectStatusOption(value: ProjectStatus) {
  return PROJECT_STATUS_OPTIONS.find((option) => option.value === value)!;
}

// YYYY-MM-DD, matching the native date input's value format and how target
// dates are already serialized elsewhere (toISOString().slice(0, 10)) --
// plain string comparison is enough and sidesteps timezone-parsing bugs
// that come from constructing Date objects just to compare calendar days.
export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function isTargetDateValid(dateString: string) {
  return dateString >= getTodayDateString();
}
