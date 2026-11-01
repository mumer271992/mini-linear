import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { verifySessionAllowUnverified } from "@/server/db/session";
import { findUserById } from "@/server/db/user";
import VerifyEmailPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));
vi.mock("@/server/db/session", () => ({ verifySessionAllowUnverified: vi.fn() }));
vi.mock("@/server/db/user", () => ({ findUserById: vi.fn() }));
vi.mock("@/server/actions/auth", () => ({ logout: vi.fn() }));
// Covered in components/resend-verification-button.test.tsx.
vi.mock("@/components/resend-verification-button", () => ({
  ResendVerificationButton: () => <button type="button">Resend email</button>,
}));

const mockedVerifySession = vi.mocked(verifySessionAllowUnverified);
const mockedFindUserById = vi.mocked(findUserById);

function session(isEmailVerified: boolean) {
  return { sessionId: "session-1", userId: "user-1", lastOrganizationId: null, isEmailVerified };
}

async function renderPage(searchParams: Record<string, string | string[]> = {}) {
  const page = await VerifyEmailPage({ searchParams: Promise.resolve(searchParams) } as never);
  render(page);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedVerifySession.mockResolvedValue(session(false));
  mockedFindUserById.mockResolvedValue({ id: "user-1", email: "sara@example.com" } as never);
});

describe("VerifyEmailPage", () => {
  it("tells an unverified user where the link went, with resend and log out", async () => {
    await renderPage();

    expect(screen.getByRole("heading", { name: "Verify your email" })).toBeInTheDocument();
    expect(screen.getByText("sara@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resend email" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("sends an already-verified user to the dashboard", async () => {
    mockedVerifySession.mockResolvedValue(session(true));

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
  });

  it("clears the session when the user no longer exists", async () => {
    mockedFindUserById.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/api/auth/clear-session");
  });

  it("explains an invalid link", async () => {
    await renderPage({ error: "invalid-link" });

    expect(screen.getByRole("alert")).toHaveTextContent("That link is invalid or has expired.");
  });

  it("ignores unknown error values", async () => {
    await renderPage({ error: "<script>" });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
