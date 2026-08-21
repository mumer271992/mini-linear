import "server-only";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error("SESSION_SECRET environment variable is not set");
}
const encodedKey = new TextEncoder().encode(secretKey);

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
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(encodedKey);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionTokenPayload;
  } catch {
    return null;
  }
}
