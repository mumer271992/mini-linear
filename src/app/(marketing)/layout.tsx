import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/[.08] px-6 py-4 dark:border-white/[.145]">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Mini Linear
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/login">Login</Link>
          <Link href="/signup">Sign up</Link>
        </nav>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t border-black/[.08] px-6 py-4 text-sm text-zinc-600 dark:border-white/[.145] dark:text-zinc-400">
        © {new Date().getFullYear()} Mini Linear
      </footer>
    </div>
  );
}
