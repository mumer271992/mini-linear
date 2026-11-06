import { NextResponse, type NextRequest } from "next/server";
import { verifyEmailVerificationToken } from "@/lib/email-verification";
import { normalizeString } from "@/lib/string";
import { getOptionalSession } from "@/server/db/session";
import { findUserById, markEmailVerified } from "@/server/db/user";

// The link from the verification email. Works without a session, since
// people often open it on another device -- but it only marks the email
// verified and never logs anyone in: the link isn't single-use, so treating
// it as a login credential would let anyone holding the email sign in.
export async function GET(request: NextRequest, ctx: RouteContext<"/verify-email/[token]">) {
  const { token } = await ctx.params;

  const [payload, session] = await Promise.all([
    verifyEmailVerificationToken(token),
    getOptionalSession(),
  ]);
  const user = payload ? await findUserById(payload.userId) : null;

  // The email check means a link sent to an old address can't verify a
  // different one the account has since moved to.
  if (!payload || !user || normalizeString(user.email) !== normalizeString(payload.email)) {
    return redirectTo(
      request,
      session ? "/verify-email?error=invalid-link" : "/login?notice=verification-link-invalid",
    );
  }

  await markEmailVerified(user.id);

  // Logged in: /login would just bounce back via Proxy, so stay in the app.
  // As this user, verifySession takes it from /dashboard. As someone else,
  // /dashboard would look like the link did nothing, so say what happened.
  if (session) {
    return redirectTo(
      request,
      session.userId === user.id ? "/dashboard" : "/verify-email/other-account",
    );
  }

  const loginParams = new URLSearchParams({ notice: "email-verified", email: user.email });
  return redirectTo(request, `/login?${loginParams}`);
}

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}
