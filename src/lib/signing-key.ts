import "server-only";

// Shared by every JWT the app signs (session cookies, email verification
// links). Each token type sets its own claims/audience so one can never be
// accepted as another -- see verifySessionToken and
// verifyEmailVerificationToken.
const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error("SESSION_SECRET environment variable is not set");
}

export const signingKey = new TextEncoder().encode(secretKey);
