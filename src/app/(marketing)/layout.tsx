import Link from "next/link";
import { GITHUB_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-paper text-ink">
      <header className="sticky top-0 z-10 border-b border-rule bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link
            href="/"
            className={cn("flex items-center gap-2 font-display text-lg font-bold tracking-[-0.02em]", FOCUS_RING)}
          >
            {/* Half-filled circle: the In Progress status, as a mark. */}
            <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4">
              <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 3.5a4.5 4.5 0 0 1 0 9z" fill="currentColor" />
            </svg>
            Mini Linear
          </Link>
          <nav className="flex items-center gap-2 text-sm font-medium">
            <Link
              href="/login"
              className={cn("rounded-full px-3 py-1.5 text-muted transition-colors hover:text-ink", FOCUS_RING)}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className={cn("rounded-full bg-ink px-4 py-1.5 text-paper transition-opacity hover:opacity-85", FOCUS_RING)}
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-muted">
          <span>© {new Date().getFullYear()} Mini Linear</span>
          <a
            href={GITHUB_URL}
            className={cn("transition-colors hover:text-ink", FOCUS_RING)}
          >
            Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
