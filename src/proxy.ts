import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

const publicRoutes = ["/", "/login", "/signup"];
// Exact matches only: /verify-email/[token] stays reachable logged out, so
// a link opened on another device still verifies.
const privateRoutes = ["/dashboard", "/onboarding", "/verify-email"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);
  const isPrivateRoute = privateRoutes.includes(path);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (isPrivateRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
