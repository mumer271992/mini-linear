import "server-only";
import { cookies } from "next/headers";
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

export async function verifySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }

    try {
      // Only succeeds when verifySession() is called from a Server Action or
      // Route Handler. Cookie mutation isn't allowed during a Server Component
      // render, so this is a no-op there — the stale cookie just fails
      // verification again next time, harmlessly.
      cookieStore.delete(SESSION_COOKIE_NAME);
    } catch {}

    return null;
  }

  return { sessionId: session.id, userId: session.userId };
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
