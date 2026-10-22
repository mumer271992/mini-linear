"use client";

import { ErrorState, type ErrorStateProps } from "@/components/error-state";

// Catches unexpected errors from any route without a closer boundary (e.g. the
// invite page when the database is unreachable). Renders inside the root layout.
export default function RootError({ error, retry }: Pick<ErrorStateProps, "error" | "retry">) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <ErrorState error={error} retry={retry} />
    </div>
  );
}
