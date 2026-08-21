import { NextResponse } from "next/server";
import { deleteSession } from "@/server/db/session";

// Cookie mutation isn't allowed during a Server Component render, so
// verifySession() can't clear an invalid session's cookie directly when
// called from a page. It redirects here instead — a Route Handler response
// *can* carry a Set-Cookie header — so the stale cookie is actually removed
// before the user lands on /login, regardless of why the session was invalid.
export async function GET(request: Request) {
  await deleteSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
