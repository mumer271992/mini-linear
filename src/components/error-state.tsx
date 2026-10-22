"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref?: string;
  homeLabel?: string;
}

// Shared body for the error.tsx boundaries. Server Component errors arrive
// here with a generic message in production, so we never show error.message --
// only the digest, which matches the entry in the server logs.
export function ErrorState({
  error,
  retry,
  homeHref = "/",
  homeLabel = "Go to homepage",
}: ErrorStateProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex w-full max-w-sm flex-col items-center text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        This is usually temporary. Try again, and if it keeps happening, come back in a few
        minutes.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-zinc-500">Error ID: {error.digest}</p>
      )}
      <div className="mt-8 flex w-full flex-col gap-3">
        <Button type="button" onClick={() => retry()} className="w-full">
          Try again
        </Button>
        <Link
          href={homeHref}
          className="text-sm font-medium text-zinc-950 hover:underline dark:text-zinc-50"
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
