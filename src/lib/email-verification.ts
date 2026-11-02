import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { signingKey } from "@/lib/signing-key";
import { sendVerificationEmail } from "@/lib/email";

export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Minimum gap between verification emails to one user. Generous on purpose:
// the demo runs on Resend's free plan, so this protects the sending quota.
export const VERIFICATION_EMAIL_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
export const VERIFICATION_EMAIL_COOLDOWN_MINUTES = VERIFICATION_EMAIL_COOLDOWN_MS / 60_000;

// Whole minutes until the cooldown ends, rounded up and never below 1 -- this
// is only shown after a send was refused, so "0 minutes" would read as a bug.
// A missing lastSentAt means another request claimed the slot a moment ago.
export function minutesUntilNextVerificationEmail(lastSentAt: Date | null, now = new Date()) {
  const elapsedMs = lastSentAt ? now.getTime() - lastSentAt.getTime() : 0;
  const remainingMs = Math.max(VERIFICATION_EMAIL_COOLDOWN_MS - elapsedMs, 0);
  return Math.max(1, Math.ceil(remainingMs / 60_000));
}

// Shares the signing key with session cookies, so the audience is what
// stops a session token from being accepted as a verification link.
const AUDIENCE = "email-verification";

interface EmailVerificationToken {
  userId: string;
  // The address the link was sent to. The caller must check it still matches
  // the user's current email, so a link can't verify an address it was never
  // sent to.
  email: string;
}

// Stateless by design: nothing is stored, so a link can't be revoked or made
// single-use. That's acceptable because following it only sets
// emailVerifiedAt (idempotent) -- it must never create a session.
export async function signEmailVerificationToken({ userId, email }: EmailVerificationToken) {
  const expirationTime = Math.floor((Date.now() + EMAIL_VERIFICATION_TTL_MS) / 1000);

  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(signingKey);
}

export async function verifyEmailVerificationToken(
  token: string,
): Promise<EmailVerificationToken | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey, {
      algorithms: ["HS256"],
      audience: AUDIENCE,
    });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

interface VerificationRecipient {
  id: string;
  name: string;
  email: string;
}

// One place that turns a user into a sent link, shared by signup and the
// resend action. Throws if APP_URL is missing or the send fails -- callers
// decide whether that's fatal.
export async function sendVerificationLink(user: VerificationRecipient) {
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    throw new Error("APP_URL environment variable is not set");
  }

  const token = await signEmailVerificationToken({ userId: user.id, email: user.email });

  await sendVerificationEmail({
    to: user.email,
    name: user.name,
    verifyUrl: new URL(`/verify-email/${token}`, appUrl).toString(),
  });
}
