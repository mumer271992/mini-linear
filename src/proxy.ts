import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

const publicRoutes = ["/", "/login", "/signup"];
const privateRoutes = ["/dashboard", "/onboarding"];

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
