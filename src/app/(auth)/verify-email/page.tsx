import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifySessionAllowUnverified } from "@/server/db/session";
import { findUserById } from "@/server/db/user";
import { logout } from "@/server/actions/auth";
import { firstSearchParam } from "@/lib/redirect";
import { Button } from "@/components/ui/button";
import { ResendVerificationButton } from "@/components/resend-verification-button";

export const metadata: Metadata = {
  title: "Verify your email · Mini Linear",
};

const logoutToLogin = logout.bind(null, "/login");

// Where verifySession sends every unverified user, so this page must use the
// AllowUnverified variant -- verifySession here would redirect in a loop.
export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const session = await verifySessionAllowUnverified();
  if (session.isEmailVerified) {
    redirect("/dashboard");
  }

  const user = await findUserById(session.userId);
  if (!user) {
    redirect("/api/auth/clear-session");
  }

  // Set by the /verify-email/[token] handler; a fixed key, never echoed text.
  const { error } = await searchParams;
  const isInvalidLink = firstSearchParam(error) === "invalid-link";

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Verify your email</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        We sent a verification link to{" "}
        <span className="font-medium text-zinc-950 dark:text-zinc-50">{user.email}</span>. Click it
        to start using Mini Linear.
      </p>

      {isInvalidLink && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          That link is invalid or has expired. Send yourself a new one below.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <ResendVerificationButton />
        <form action={logoutToLogin}>
          <Button
            type="submit"
            className="w-full border border-black/[.08] bg-transparent text-foreground hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
          >
            Log out
          </Button>
        </form>
      </div>
    </div>
  );
}
