// @vitest-environment node
//
// Same reason as session.test.ts: jose's `instanceof Uint8Array` checks fail
// across jsdom's realm, and this file does no DOM work.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";
import { sendVerificationEmail } from "@/lib/email";
import {
  EMAIL_VERIFICATION_TTL_MS,
  sendVerificationLink,
  signEmailVerificationToken,
  verifyEmailVerificationToken,
} from "./email-verification";
import { signSessionToken, verifySessionToken } from "./session";
import { signingKey } from "./signing-key";

vi.mock("@/lib/email", () => ({ sendVerificationEmail: vi.fn() }));

const mockedSendVerificationEmail = vi.mocked(sendVerificationEmail);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("signEmailVerificationToken / verifyEmailVerificationToken", () => {
  it("round-trips the user id and email", async () => {
    const token = await signEmailVerificationToken({ userId: "user-1", email: "a@example.com" });

    await expect(verifyEmailVerificationToken(token)).resolves.toEqual({
      userId: "user-1",
      email: "a@example.com",
    });
  });

  it("returns null for a garbage token", async () => {
    await expect(verifyEmailVerificationToken("not-a-real-token")).resolves.toBeNull();
  });

  it("returns null once the token has expired", async () => {
    vi.useFakeTimers();
    const token = await signEmailVerificationToken({ userId: "user-1", email: "a@example.com" });

    vi.setSystemTime(Date.now() + EMAIL_VERIFICATION_TTL_MS + 1000);

    await expect(verifyEmailVerificationToken(token)).resolves.toBeNull();
  });

  it("returns null for a token signed with a different secret", async () => {
    const wrongKey = new TextEncoder().encode("a-completely-different-secret");
    const token = await new SignJWT({ email: "a@example.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-1")
      .setAudience("email-verification")
      .setExpirationTime(Math.floor(Date.now() / 1000) + 60)
      .sign(wrongKey);

    await expect(verifyEmailVerificationToken(token)).resolves.toBeNull();
  });

  it("returns null for a token missing the email claim", async () => {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-1")
      .setAudience("email-verification")
      .setExpirationTime(Math.floor(Date.now() / 1000) + 60)
      .sign(signingKey);

    await expect(verifyEmailVerificationToken(token)).resolves.toBeNull();
  });
});

describe("token types don't cross over", () => {
  it("rejects a session token as a verification link", async () => {
    const sessionToken = await signSessionToken({ sessionId: "session-1", userId: "user-1" });

    await expect(verifyEmailVerificationToken(sessionToken)).resolves.toBeNull();
  });

  it("rejects a verification link as a session token", async () => {
    const verificationToken = await signEmailVerificationToken({
      userId: "user-1",
      email: "a@example.com",
    });

    await expect(verifySessionToken(verificationToken)).resolves.toBeNull();
  });
});

describe("sendVerificationLink", () => {
  const user = { id: "user-1", name: "Sara", email: "sara@example.com" };

  it("emails a link whose token verifies back to the same user and email", async () => {
    vi.stubEnv("APP_URL", "https://mini-linear.test");

    await sendVerificationLink(user);

    const [args] = mockedSendVerificationEmail.mock.calls[0];
    expect(args.to).toBe("sara@example.com");
    expect(args.name).toBe("Sara");

    const url = new URL(args.verifyUrl);
    expect(url.origin).toBe("https://mini-linear.test");
    const token = url.pathname.replace("/verify-email/", "");
    await expect(verifyEmailVerificationToken(token)).resolves.toEqual({
      userId: "user-1",
      email: "sara@example.com",
    });
  });

  it("throws without sending when APP_URL isn't set", async () => {
    vi.stubEnv("APP_URL", "");

    await expect(sendVerificationLink(user)).rejects.toThrow("APP_URL");
    expect(mockedSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("lets a send failure propagate to the caller", async () => {
    vi.stubEnv("APP_URL", "https://mini-linear.test");
    mockedSendVerificationEmail.mockRejectedValue(new Error("send failed"));

    await expect(sendVerificationLink(user)).rejects.toThrow("send failed");
  });
});
