import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  label: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  children: ReactNode;
}

const SIDE_CLASSES: Record<NonNullable<TooltipProps["side"]>, string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
};

// CSS-only: shows on hover and on keyboard focus of anything inside, without
// the native title delay. Purely visual -- give icon-only triggers their own
// aria-label, since screen readers don't get the tooltip text from here.
// Uses a named group so it doesn't react to a `group` class on an ancestor.
export function Tooltip({ label, side = "top", className, children }: TooltipProps) {
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-10 whitespace-nowrap rounded-md bg-zinc-950 px-2 py-1 text-xs text-zinc-50 opacity-0 transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 dark:bg-zinc-50 dark:text-zinc-950",
          SIDE_CLASSES[side],
        )}
      >
        {label}
      </span>
    </span>
  );
}
