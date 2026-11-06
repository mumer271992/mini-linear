import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalSession } from "@/server/db/session";
import { findUserById } from "@/server/db/user";
import { logout } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Email verified · Mini Linear",
};

const logoutToLogin = logout.bind(null, "/login");

const CONTINUE_LINK =
  "flex justify-center rounded-full border border-black/[.08] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]";

// Where /verify-email/[token] lands someone who opened another account's
// link while logged in. Without it they'd be bounced to /dashboard (or, if
// unverified, to /verify-email), which reads as if the link failed.
// Deliberately doesn't name the verified account: the only source would be
// the URL, and anyone could craft one claiming any address was verified.
export default async function OtherAccountVerifiedPage() {
  const session = await getOptionalSession();
  if (!session) {
    redirect("/login");
  }

  const user = await findUserById(session.userId);
  if (!user) {
    redirect("/api/auth/clear-session");
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">That link was for a different account</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        It&apos;s verified now. You&apos;re signed in as{" "}
        <span className="font-medium text-zinc-950 dark:text-zinc-50">{user.email}</span>. To use the
        account you just verified, log out and sign in with it.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <form action={logoutToLogin}>
          <Button type="submit" className="w-full">
            Log out
          </Button>
        </form>
        {/* verifySession takes over from /dashboard, so an unverified
            current account still ends up on /verify-email. */}
        <Link href="/dashboard" className={CONTINUE_LINK}>
          Continue as {user.email}
        </Link>
      </div>
    </div>
  );
}
