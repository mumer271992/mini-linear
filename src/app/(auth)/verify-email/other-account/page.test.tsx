import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { getOptionalSession } from "@/server/db/session";
import { findUserById } from "@/server/db/user";
import OtherAccountVerifiedPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));
vi.mock("@/server/db/session", () => ({ getOptionalSession: vi.fn() }));
vi.mock("@/server/db/user", () => ({ findUserById: vi.fn() }));
vi.mock("@/server/actions/auth", () => ({ logout: vi.fn() }));

const mockedGetOptionalSession = vi.mocked(getOptionalSession);
const mockedFindUserById = vi.mocked(findUserById);

async function renderPage() {
  render(await OtherAccountVerifiedPage());
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetOptionalSession.mockResolvedValue({
    sessionId: "session-1",
    userId: "user-2",
    lastOrganizationId: null,
    isEmailVerified: false,
  });
  mockedFindUserById.mockResolvedValue({ id: "user-2", email: "bob@example.com" } as never);
});

describe("OtherAccountVerifiedPage", () => {
  it("says the link was for another account and who is signed in", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", { name: "That link was for a different account" }),
    ).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    expect(mockedFindUserById).toHaveBeenCalledWith("user-2");
  });

  it("offers to log out or continue as the current account", async () => {
    await renderPage();

    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue as bob@example.com" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it("sends a logged-out visitor to login", async () => {
    mockedGetOptionalSession.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mockedFindUserById).not.toHaveBeenCalled();
  });

  it("clears the session when the current user no longer exists", async () => {
    mockedFindUserById.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/api/auth/clear-session");
  });
});
