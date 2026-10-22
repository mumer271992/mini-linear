"use client";

import { useEffect, useState } from "react";
import { TASK_STATUS_OPTIONS } from "@/lib/task";
import { cn } from "@/lib/utils";

// The happy path through the workflow -- Cancelled is an off-ramp, not a step.
const WORKFLOW = TASK_STATUS_OPTIONS.filter((option) => option.value !== "CANCELLED");

const START_DELAY_MS = 700;
const STEP_MS = 950;

// Plays once on load and stops at Done. With reduced motion it skips
// straight to the end state instead of stepping through.
export function CyclingTaskRow() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lastStep = WORKFLOW.length - 1;

    const timers = reduceMotion
      ? [window.setTimeout(() => setStep(lastStep), 0)]
      : WORKFLOW.slice(1).map((_, index) =>
          window.setTimeout(() => setStep(index + 1), START_DELAY_MS + index * STEP_MS),
        );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const status = WORKFLOW[step];

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 bg-ink/4 px-4 py-3 ring-1 ring-inset ring-ink/15 sm:grid-cols-[1fr_7rem_8.5rem]">
      <span className="truncate font-medium">
        Design the landing page
      </span>
      <span className="hidden text-muted sm:block">You</span>
      <span className="flex items-center gap-2">
        <span
          key={status.value}
          className={cn("h-2 w-2 shrink-0 rounded-full motion-safe:animate-[status-pop_400ms_ease-out]", status.dotColor)}
        />
        {status.label}
      </span>
    </div>
  );
}
