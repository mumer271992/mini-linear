import { cn } from "@/lib/utils";

export interface SkeletonProps {
  className?: string;
}

// A single placeholder block -- size and shape come from className.
export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={cn("rounded-md bg-zinc-200 dark:bg-zinc-800", className)} />;
}

export interface TableSkeletonProps {
  columns: string[];
  rows?: number;
  className?: string;
}

// Same border/padding as the real tables, with the real column headers -- only
// the cells are placeholders, so the swap to data doesn't shift the layout.
// An empty column name is an icon-only actions column (e.g. Revoke access).
export function TableSkeleton({ columns, rows = 5, className }: TableSkeletonProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-black/[.08] dark:border-white/[.145]",
        className,
      )}
    >
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/[.08] text-zinc-600 dark:border-white/[.145] dark:text-zinc-400">
            {columns.map((column) => (
              <th key={column} className={cn("px-4 py-3 font-medium", !column && "w-12")}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr
              key={row}
              className="border-b border-black/[.08] last:border-b-0 dark:border-white/[.145]"
            >
              {columns.map((column) => (
                <td key={column} className={cn("px-4 py-3", !column && "w-12")}>
                  <Skeleton className={column ? "h-5 w-24" : "h-4 w-4"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
