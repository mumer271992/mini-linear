import { beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { verifySessionToken } from "@/lib/session";
import { getOptionalSession, verifySession, verifySessionAllowUnverified } from "./session";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
// Real redirect() throws to stop rendering; mirror that so code after it
// never runs in a test.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));
vi.mock("@/server/db", () => ({
  prisma: { session: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/session", () => ({
  SESSION_COOKIE_NAME: "session",
  SESSION_DURATION_MS: 1000,
  signSessionToken: vi.fn(),
  verifySessionToken: vi.fn(),
}));

const mockedCookies = vi.mocked(cookies);
const mockedRedirect = vi.mocked(redirect);
const mockedFindUnique = vi.mocked(prisma.session.findUnique);
const mockedVerifySessionToken = vi.mocked(verifySessionToken);

function sessionRow(emailVerifiedAt: Date | null, overrides: Record<string, unknown> = {}) {
  return {
    id: "session-1",
    userId: "user-1",
    lastOrganizationId: null,
    expiresAt: new Date(Date.now() + 60_000),
    user: { emailVerifiedAt },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedCookies.mockResolvedValue({
    get: () => ({ value: "cookie-token" }),
  } as never);
  mockedVerifySessionToken.mockResolvedValue({ sessionId: "session-1", userId: "user-1" });
});

describe("getOptionalSession", () => {
  it("returns null without a cookie", async () => {
    mockedCookies.mockResolvedValue({ get: () => undefined } as never);

    await expect(getOptionalSession()).resolves.toBeNull();
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });

  it("returns null for an expired session row", async () => {
    mockedFindUnique.mockResolvedValue(
      sessionRow(new Date(), { expiresAt: new Date(Date.now() - 1000) }) as never,
    );

    await expect(getOptionalSession()).resolves.toBeNull();
  });

  it("loads the user's verification status in the same query", async () => {
    mockedFindUnique.mockResolvedValue(sessionRow(null) as never);

    await expect(getOptionalSession()).resolves.toEqual({
      sessionId: "session-1",
      userId: "user-1",
      lastOrganizationId: null,
      isEmailVerified: false,
    });
    expect(mockedFindUnique).toHaveBeenCalledWith({
      where: { id: "session-1" },
      include: { user: { select: { emailVerifiedAt: true } } },
    });
  });
});

describe("verifySessionAllowUnverified", () => {
  it("sends a logged-out visitor to clear-session", async () => {
    mockedFindUnique.mockResolvedValue(null);

    await expect(verifySessionAllowUnverified()).rejects.toThrow(
      "NEXT_REDIRECT:/api/auth/clear-session",
    );
  });

  it("returns an unverified user's session", async () => {
    mockedFindUnique.mockResolvedValue(sessionRow(null) as never);

    await expect(verifySessionAllowUnverified()).resolves.toMatchObject({
      userId: "user-1",
      isEmailVerified: false,
    });
    expect(mockedRedirect).not.toHaveBeenCalled();
  });
});

describe("verifySession", () => {
  it("sends a logged-out visitor to clear-session", async () => {
    mockedFindUnique.mockResolvedValue(null);

    await expect(verifySession()).rejects.toThrow("NEXT_REDIRECT:/api/auth/clear-session");
  });

  it("sends an unverified user to /verify-email", async () => {
    mockedFindUnique.mockResolvedValue(sessionRow(null) as never);

    await expect(verifySession()).rejects.toThrow("NEXT_REDIRECT:/verify-email");
  });

  it("returns a verified user's session", async () => {
    mockedFindUnique.mockResolvedValue(sessionRow(new Date()) as never);

    await expect(verifySession()).resolves.toEqual({
      sessionId: "session-1",
      userId: "user-1",
      lastOrganizationId: null,
    });
    expect(mockedRedirect).not.toHaveBeenCalled();
  });
});
