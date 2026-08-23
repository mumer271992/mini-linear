import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  signSessionToken,
  verifySessionToken,
} from "@/lib/session";
import { prisma } from "@/server/db";

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });

  const token = await signSessionToken({
    sessionId: session.id,
    userId,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  const payload = token ? await verifySessionToken(token) : null;
  const session = payload
    ? await prisma.session.findUnique({ where: { id: payload.sessionId } })
    : null;

  if (!session || session.expiresAt < new Date()) {
    // Redirect to a Route Handler rather than clearing the cookie here —
    // cookie mutation isn't allowed during a Server Component render, so a
    // direct delete would silently fail. The Route Handler's response can
    // carry a real Set-Cookie header, so the stale cookie actually gets
    // removed before the user lands on /login.
    redirect("/api/auth/clear-session");
  }

  return {
    sessionId: session.id,
    userId: session.userId,
    lastOrganizationId: session.lastOrganizationId,
  };
});

export async function setSessionOrganization(
  sessionId: string,
  organizationId: string,
) {
  await prisma.session.update({
    where: { id: sessionId },
    data: { lastOrganizationId: organizationId },
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const payload = await verifySessionToken(token);
    if (payload) {
      await prisma.session.delete({ where: { id: payload.sessionId } }).catch(() => {});
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
