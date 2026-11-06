import "server-only";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { signingKey } from "@/lib/signing-key";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Every JWT the app signs shares one key (see signing-key.ts); the audience
// is what stops another token type, such as an email verification link the
// user received, from being accepted as a session cookie.
const AUDIENCE = "session";

export interface SessionTokenPayload extends JWTPayload {
  sessionId: string;
  userId: string;
}

export async function signSessionToken(payload: SessionTokenPayload) {
  // Bounds how long Proxy will trust this cookie without a DB check. The
  // database session row remains the authority for early revocation (logout
  // clears the cookie directly, since that runs as a Server Action); this
  // only stops Proxy from waving through a cookie whose session has long
  // since naturally expired but never got cleared client-side.
  const expirationTime = Math.floor((Date.now() + SESSION_DURATION_MS) / 1000);

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(signingKey);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, signingKey, {
      algorithms: ["HS256"],
      audience: AUDIENCE,
    });
    // Shape check so the cast below is backed by something, not just trust
    // in whoever signed the token.
    if (typeof payload.sessionId !== "string" || typeof payload.userId !== "string") {
      return null;
    }
    return payload as SessionTokenPayload;
  } catch {
    return null;
  }
}
