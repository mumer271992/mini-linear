"use client";

import type { ReactNode } from "react";
import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export interface LinkPendingIconProps {
  children: ReactNode;
}

// Swaps a Link's icon for a spinner while its navigation is in flight. Must
// render inside the <Link> -- useLinkStatus reads the nearest one. The swap
// waits 100ms so fast or prefetched navigations don't flash a spinner, and the
// spinner sits on top of the icon so the button never changes size.
export function LinkPendingIcon({ children }: LinkPendingIconProps) {
  const { pending } = useLinkStatus();

  return (
    <span className="relative inline-flex">
      <span
        className={cn(
          "inline-flex",
          pending && "animate-[link-pending-out_0s_100ms_forwards]",
        )}
      >
        {children}
      </span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center opacity-0 animate-[link-pending-in_150ms_ease_100ms_forwards]">
          <Spinner />
        </span>
      )}
    </span>
  );
}
