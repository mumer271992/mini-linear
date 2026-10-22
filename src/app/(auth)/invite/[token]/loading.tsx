// Mirrors InviteLayout in page.tsx (heading, intro line, action buttons) so
// the swap to the real content doesn't shift the layout. The auth layout's
// right-hand panel is outside this boundary and stays on screen.
export default function AcceptInviteLoading() {
  return (
    <div role="status" aria-label="Loading invite" className="w-full max-w-sm animate-pulse">
      <div className="h-8 w-3/4 rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-3 flex flex-col gap-2">
        <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="mt-8 flex flex-col gap-3">
        <div className="h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
