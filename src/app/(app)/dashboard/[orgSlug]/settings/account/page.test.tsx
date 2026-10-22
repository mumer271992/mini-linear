import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import { verifySession } from "@/server/db/session";
import { requireMembership } from "@/server/db/organization";
import { findUserById } from "@/server/db/user";
import AccountSettingsPage from "./page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("@/server/db/session", () => ({ verifySession: vi.fn() }));
vi.mock("@/server/db/organization", () => ({ requireMembership: vi.fn() }));
vi.mock("@/server/db/user", () => ({ findUserById: vi.fn() }));

const mockedVerifySession = vi.mocked(verifySession);
const mockedRequireMembership = vi.mocked(requireMembership);
const mockedFindUserById = vi.mocked(findUserById);

async function renderPage() {
  const page = await AccountSettingsPage({
    params: Promise.resolve({ orgSlug: "acme" }),
  } as never);
  render(page);
}

describe("AccountSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedVerifySession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
      lastOrganizationId: null,
    });
    mockedRequireMembership.mockResolvedValue({} as never);
    mockedFindUserById.mockResolvedValue({
      id: "user-1",
      email: "alice@example.com",
    } as never);
  });

  it("checks membership of the org in the URL", async () => {
    await renderPage();
    expect(mockedRequireMembership).toHaveBeenCalledWith("user-1", "acme");
  });

  it("renders the Account heading", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Account" })).toBeInTheDocument();
  });

  it("shows the logged-in user's email in a disabled field", async () => {
    await renderPage();
    const email = screen.getByLabelText("Email");
    expect(mockedFindUserById).toHaveBeenCalledWith("user-1");
    expect(email).toHaveValue("alice@example.com");
    expect(email).toBeDisabled();
  });

  it("404s when the session's user no longer exists", async () => {
    mockedFindUserById.mockResolvedValue(null);
    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
