import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { verifyEmailVerificationToken } from "@/lib/email-verification";
import { getOptionalSession } from "@/server/db/session";
import { findUserById, markEmailVerified } from "@/server/db/user";
import { GET } from "./route";

vi.mock("@/lib/email-verification", () => ({ verifyEmailVerificationToken: vi.fn() }));
vi.mock("@/server/db/session", () => ({ getOptionalSession: vi.fn() }));
vi.mock("@/server/db/user", () => ({ findUserById: vi.fn(), markEmailVerified: vi.fn() }));

const mockedVerifyToken = vi.mocked(verifyEmailVerificationToken);
const mockedGetOptionalSession = vi.mocked(getOptionalSession);
const mockedFindUserById = vi.mocked(findUserById);
const mockedMarkEmailVerified = vi.mocked(markEmailVerified);

const user = { id: "user-1", email: "sara@example.com" };
const loggedIn = {
  sessionId: "session-1",
  userId: "user-1",
  lastOrganizationId: null,
  isEmailVerified: false,
};

async function follow(token = "token-1") {
  const request = new NextRequest(`https://mini-linear.test/verify-email/${token}`);
  const response = await GET(request, { params: Promise.resolve({ token }) });
  const location = new URL(response.headers.get("location")!);
  return { status: response.status, path: location.pathname + location.search };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedVerifyToken.mockResolvedValue({ userId: "user-1", email: "sara@example.com" });
  mockedFindUserById.mockResolvedValue(user as never);
  mockedGetOptionalSession.mockResolvedValue(null);
});

describe("GET /verify-email/[token]", () => {
  it("verifies and sends a logged-out user to login with a notice and their email", async () => {
    const { status, path } = await follow();

    expect(status).toBe(307);
    expect(mockedMarkEmailVerified).toHaveBeenCalledWith("user-1");
    expect(path).toBe("/login?notice=email-verified&email=sara%40example.com");
  });

  it("verifies and sends the same user, logged in, into the app", async () => {
    mockedGetOptionalSession.mockResolvedValue(loggedIn);

    const { path } = await follow();

    expect(mockedMarkEmailVerified).toHaveBeenCalledWith("user-1");
    expect(path).toBe("/dashboard");
  });

  it("verifies and explains when a different account is logged in", async () => {
    mockedGetOptionalSession.mockResolvedValue({ ...loggedIn, userId: "user-2" });

    const { path } = await follow();

    expect(mockedMarkEmailVerified).toHaveBeenCalledWith("user-1");
    expect(path).toBe("/verify-email/other-account");
  });

  it("matches the email case- and whitespace-insensitively", async () => {
    mockedFindUserById.mockResolvedValue({ id: "user-1", email: " Sara@Example.com" } as never);

    await follow();

    expect(mockedMarkEmailVerified).toHaveBeenCalledWith("user-1");
  });

  describe("invalid links", () => {
    it("rejects a bad or expired token", async () => {
      mockedVerifyToken.mockResolvedValue(null);

      const { path } = await follow();

      expect(path).toBe("/login?notice=verification-link-invalid");
      expect(mockedFindUserById).not.toHaveBeenCalled();
      expect(mockedMarkEmailVerified).not.toHaveBeenCalled();
    });

    it("rejects a token for a user that no longer exists", async () => {
      mockedFindUserById.mockResolvedValue(null);

      const { path } = await follow();

      expect(path).toBe("/login?notice=verification-link-invalid");
      expect(mockedMarkEmailVerified).not.toHaveBeenCalled();
    });

    it("rejects a token sent to an email the user no longer has", async () => {
      mockedFindUserById.mockResolvedValue({ id: "user-1", email: "new@example.com" } as never);

      const { path } = await follow();

      expect(path).toBe("/login?notice=verification-link-invalid");
      expect(mockedMarkEmailVerified).not.toHaveBeenCalled();
    });

    it("sends a logged-in user back to /verify-email to request a new link", async () => {
      mockedVerifyToken.mockResolvedValue(null);
      mockedGetOptionalSession.mockResolvedValue(loggedIn);

      const { path } = await follow();

      expect(path).toBe("/verify-email?error=invalid-link");
    });
  });
});
