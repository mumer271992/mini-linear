import { getTaskStatusCounts } from "@/server/db/task";
import { getTaskStatusOption } from "@/lib/task";
import { cn } from "@/lib/utils";

interface TaskStatusStatsProps {
  orgSlug: string;
}

const STAT_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;

export async function TaskStatusStats({ orgSlug }: TaskStatusStatsProps) {
  const counts = await getTaskStatusCounts(orgSlug);

  return (
    <div className="grid grid-cols-3 gap-4">
      {STAT_STATUSES.map((status) => {
        const option = getTaskStatusOption(status);

        return (
          <div
            key={status}
            className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
          >
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span className={cn("h-2 w-2 rounded-full", option.dotColor)} />
              {option.label}
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts[status]}</p>
          </div>
        );
      })}
    </div>
  );
}
