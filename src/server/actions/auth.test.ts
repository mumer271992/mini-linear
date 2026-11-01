import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { generatePasswordHash, verifyPasswordHash } from "@/lib/auth";
import { createSession, deleteSession, verifySessionAllowUnverified } from "@/server/db/session";
import { createUserWithEmail, findUserByEmail, findUserById } from "@/server/db/user";
import { sendVerificationLink } from "@/lib/email-verification";
import { login, logout, resendVerificationEmail, signup } from "./auth";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  generatePasswordHash: vi.fn(),
  verifyPasswordHash: vi.fn(),
}));
vi.mock("@/server/db/session", () => ({
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  verifySessionAllowUnverified: vi.fn(),
}));
vi.mock("@/lib/email-verification", () => ({ sendVerificationLink: vi.fn() }));
vi.mock("@/server/db/user", () => ({
  createUserWithEmail: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
}));

const mockedGeneratePasswordHash = vi.mocked(generatePasswordHash);
const mockedVerifyPasswordHash = vi.mocked(verifyPasswordHash);
const mockedCreateSession = vi.mocked(createSession);
const mockedDeleteSession = vi.mocked(deleteSession);
const mockedCreateUserWithEmail = vi.mocked(createUserWithEmail);
const mockedFindUserByEmail = vi.mocked(findUserByEmail);
const mockedRedirect = vi.mocked(redirect);
const mockedAfter = vi.mocked(after);

// Runs whatever signup scheduled with after(), the way Next.js would once
// the response has gone out.
async function runAfterCallbacks() {
  for (const [callback] of mockedAfter.mock.calls) {
    await (callback as () => Promise<void>)();
  }
}
const mockedSendVerificationLink = vi.mocked(sendVerificationLink);
const mockedVerifySessionAllowUnverified = vi.mocked(verifySessionAllowUnverified);
const mockedFindUserById = vi.mocked(findUserById);

beforeEach(() => {
  vi.clearAllMocks();
  // clearAllMocks keeps implementations -- reset this one so a test that
  // makes sending fail doesn't leak into the next.
  mockedSendVerificationLink.mockResolvedValue(undefined);
  mockedFindUserByEmail.mockResolvedValue(null);
});

describe("signup", () => {
  it("rejects a missing email", async () => {
    const result = await signup({ name: "A", email: "", password: "pw" });
    expect(result).toEqual({ error: "Email and password are required." });
  });

  it("rejects a missing password", async () => {
    const result = await signup({
      name: "A",
      email: "a@example.com",
      password: "",
    });
    expect(result).toEqual({ error: "Email and password are required." });
  });

  it("rejects an email that's already registered", async () => {
    mockedFindUserByEmail.mockResolvedValue({ id: "user-existing" } as never);

    const result = await signup({
      name: "A",
      email: "a@example.com",
      password: "pw",
    });

    expect(result).toEqual({
      error: "An account with this email already exists.",
    });
    expect(mockedCreateUserWithEmail).not.toHaveBeenCalled();
  });

  it("creates the user, session, and redirects on success", async () => {
    mockedGeneratePasswordHash.mockResolvedValue("hashed-pw");
    mockedCreateUserWithEmail.mockResolvedValue({ id: "user-1" } as never);

    await signup({ name: "A", email: "a@example.com", password: "pw" });

    expect(mockedCreateUserWithEmail).toHaveBeenCalledWith({
      name: "A",
      email: "a@example.com",
      passwordHash: "hashed-pw",
    });
    expect(mockedCreateSession).toHaveBeenCalledWith("user-1");
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("sends the verification link after the response, not before redirecting", async () => {
    mockedGeneratePasswordHash.mockResolvedValue("hashed-pw");
    mockedCreateUserWithEmail.mockResolvedValue({
      id: "user-1",
      name: "A",
      email: "a@example.com",
      passwordHash: "hashed-pw",
    } as never);

    await signup({ name: "A", email: "a@example.com", password: "pw" });

    // Redirected without waiting on the email provider...
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard");
    expect(mockedSendVerificationLink).not.toHaveBeenCalled();

    // ...and the send happens once the response is done, with only the
    // fields the email needs.
    await runAfterCallbacks();
    expect(mockedSendVerificationLink).toHaveBeenCalledWith({
      id: "user-1",
      name: "A",
      email: "a@example.com",
    });
  });

  it("swallows and logs a failed verification send", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedGeneratePasswordHash.mockResolvedValue("hashed-pw");
    mockedCreateUserWithEmail.mockResolvedValue({ id: "user-1" } as never);
    mockedSendVerificationLink.mockRejectedValue(new Error("send failed"));

    await signup({ name: "A", email: "a@example.com", password: "pw" });

    await expect(runAfterCallbacks()).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(new Error("send failed"));
  });

  it("redirects to a safe next path instead of /dashboard", async () => {
    mockedGeneratePasswordHash.mockResolvedValue("hashed-pw");
    mockedCreateUserWithEmail.mockResolvedValue({ id: "user-1" } as never);

    await signup({ name: "A", email: "a@example.com", password: "pw", next: "/invite/abc" });

    expect(mockedRedirect).toHaveBeenCalledWith("/invite/abc");
  });

  it("falls back to /dashboard when next is off-site", async () => {
    mockedGeneratePasswordHash.mockResolvedValue("hashed-pw");
    mockedCreateUserWithEmail.mockResolvedValue({ id: "user-1" } as never);

    await signup({ name: "A", email: "a@example.com", password: "pw", next: "https://evil.com" });

    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("treats a concurrent duplicate email (P2002) as a normal error message", async () => {
    mockedGeneratePasswordHash.mockResolvedValue("hashed-pw");
    mockedCreateUserWithEmail.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6.19.3",
      }),
    );

    const result = await signup({
      name: "A",
      email: "a@example.com",
      password: "pw",
    });

    expect(result).toEqual({
      error: "An account with this email already exists.",
    });
    expect(mockedCreateSession).not.toHaveBeenCalled();
    expect(mockedAfter).not.toHaveBeenCalled();
  });
});

describe("login", () => {
  it("rejects missing credentials", async () => {
    const result = await login({ email: "", password: "" });
    expect(result).toEqual({ error: "Email and password are required." });
  });

  it("gives the same generic error when the user doesn't exist", async () => {
    mockedFindUserByEmail.mockResolvedValue(null);

    const result = await login({ email: "a@example.com", password: "pw" });

    expect(result).toEqual({ error: "Invalid email or password." });
  });

  it("gives the same generic error for an account with no password set", async () => {
    mockedFindUserByEmail.mockResolvedValue({
      id: "user-1",
      passwordHash: null,
    } as never);

    const result = await login({ email: "a@example.com", password: "pw" });

    expect(result).toEqual({ error: "Invalid email or password." });
  });

  it("gives the same generic error for a wrong password", async () => {
    mockedFindUserByEmail.mockResolvedValue({
      id: "user-1",
      passwordHash: "hashed-pw",
    } as never);
    mockedVerifyPasswordHash.mockResolvedValue(false);

    const result = await login({ email: "a@example.com", password: "wrong" });

    expect(result).toEqual({ error: "Invalid email or password." });
  });

  it("creates a session and redirects on success", async () => {
    mockedFindUserByEmail.mockResolvedValue({
      id: "user-1",
      passwordHash: "hashed-pw",
    } as never);
    mockedVerifyPasswordHash.mockResolvedValue(true);

    await login({ email: "a@example.com", password: "pw" });

    expect(mockedCreateSession).toHaveBeenCalledWith("user-1");
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects to a safe next path instead of /dashboard", async () => {
    mockedFindUserByEmail.mockResolvedValue({ id: "user-1", passwordHash: "hashed-pw" } as never);
    mockedVerifyPasswordHash.mockResolvedValue(true);

    await login({ email: "a@example.com", password: "pw", next: "/invite/abc" });

    expect(mockedRedirect).toHaveBeenCalledWith("/invite/abc");
  });

  it("falls back to /dashboard when next is off-site", async () => {
    mockedFindUserByEmail.mockResolvedValue({ id: "user-1", passwordHash: "hashed-pw" } as never);
    mockedVerifyPasswordHash.mockResolvedValue(true);

    await login({ email: "a@example.com", password: "pw", next: "//evil.com" });

    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard");
  });
});

describe("logout", () => {
  it("deletes the session and redirects to / when no fallback is given", async () => {
    await logout();

    expect(mockedDeleteSession).toHaveBeenCalled();
    expect(mockedRedirect).toHaveBeenCalledWith("/");
  });

  it("redirects to a safe relative fallback path", async () => {
    await logout("/signup");
    expect(mockedRedirect).toHaveBeenCalledWith("/signup");
  });

  it("falls back to / for an absolute external URL", async () => {
    await logout("https://evil.com");
    expect(mockedRedirect).toHaveBeenCalledWith("/");
  });

  it("falls back to / for a protocol-relative URL", async () => {
    await logout("//evil.com");
    expect(mockedRedirect).toHaveBeenCalledWith("/");
  });

  it("ignores a backslash fallback that browsers treat as protocol-relative", async () => {
    await logout("/\\evil.com");
    expect(mockedRedirect).toHaveBeenCalledWith("/");
  });
});

describe("resendVerificationEmail", () => {
  const user = { id: "user-1", name: "A", email: "a@example.com" };

  function session(isEmailVerified: boolean) {
    return { sessionId: "session-1", userId: "user-1", lastOrganizationId: null, isEmailVerified };
  }

  beforeEach(() => {
    mockedVerifySessionAllowUnverified.mockResolvedValue(session(false));
    mockedFindUserById.mockResolvedValue(user as never);
  });

  it("sends a new link to the logged-in user", async () => {
    const result = await resendVerificationEmail();

    expect(result).toEqual({ success: true });
    expect(mockedSendVerificationLink).toHaveBeenCalledWith(user);
  });

  it("doesn't send when the email is already verified", async () => {
    mockedVerifySessionAllowUnverified.mockResolvedValue(session(true));

    const result = await resendVerificationEmail();

    expect(result).toEqual({ error: "Your email is already verified." });
    expect(mockedSendVerificationLink).not.toHaveBeenCalled();
  });

  it("returns a generic error when the user is missing", async () => {
    mockedFindUserById.mockResolvedValue(null);

    const result = await resendVerificationEmail();

    expect(result).toEqual({ error: "Something went wrong. Please try again." });
    expect(mockedSendVerificationLink).not.toHaveBeenCalled();
  });

  it("returns an error without leaking details when sending fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockedSendVerificationLink.mockRejectedValue(new Error("Resend: invalid API key"));

    const result = await resendVerificationEmail();

    expect(result).toEqual({ error: "Couldn't send the email. Please try again." });
  });
});
