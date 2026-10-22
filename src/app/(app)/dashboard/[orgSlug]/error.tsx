"use client";

import { useParams } from "next/navigation";
import { ErrorState, type ErrorStateProps } from "@/components/error-state";

// Sits inside the [orgSlug] layout, so the sidebar stays usable and only the
// main area is replaced -- the user can navigate away without a full reload.
export default function DashboardError({ error, retry }: Pick<ErrorStateProps, "error" | "retry">) {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <ErrorState
        error={error}
        retry={retry}
        homeHref={`/dashboard/${orgSlug}`}
        homeLabel="Go to overview"
      />
    </div>
  );
}
