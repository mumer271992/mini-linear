import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { getOptionalSession } from "@/server/db/session";
import { findInviteByToken } from "@/server/db/invite";
import { findUserById } from "@/server/db/user";
import { isOrganizationMember } from "@/server/db/organization";
import { logout } from "@/server/actions/auth";
import AcceptInvitePage from "./page";

vi.mock("@/server/db/session", () => ({ getOptionalSession: vi.fn() }));
vi.mock("@/server/db/invite", () => ({ findInviteByToken: vi.fn() }));
vi.mock("@/server/db/user", () => ({ findUserById: vi.fn() }));
vi.mock("@/server/db/organization", () => ({ isOrganizationMember: vi.fn() }));
vi.mock("@/server/actions/auth", () => ({ logout: vi.fn() }));
// AcceptInviteButton has its own coverage -- stub it to a marker.
vi.mock("@/components/accept-invite-button", () => ({
  AcceptInviteButton: ({ token }: { token: string }) => <button type="button">accept {token}</button>,
}));

const mockedGetOptionalSession = vi.mocked(getOptionalSession);
const mockedFindInviteByToken = vi.mocked(findInviteByToken);
const mockedFindUserById = vi.mocked(findUserById);
const mockedIsOrganizationMember = vi.mocked(isOrganizationMember);
const mockedLogout = vi.mocked(logout);

const DAY_MS = 24 * 60 * 60 * 1000;
const NEXT_AND_EMAIL = "next=%2Finvite%2Ftoken-1&email=bob%40example.com";

function pendingInvite(overrides: Record<string, unknown> = {}) {
  return {
    id: "invite-1",
    email: "bob@example.com",
    status: "PENDING",
    expiresAt: new Date(Date.now() + DAY_MS),
    organization: { id: "org-1", name: "Acme", slug: "acme" },
    invitedBy: { id: "user-1", name: "Alice" },
    role: { id: "role-member", name: "Member" },
    ...overrides,
  };
}

async function renderPage() {
  const page = await AcceptInvitePage({ params: Promise.resolve({ token: "token-1" }) } as never);
  render(page);
}

function signedInAs(email: string) {
  mockedGetOptionalSession.mockResolvedValue({
    sessionId: "session-2",
    userId: "user-2",
    lastOrganizationId: null,
  });
  mockedFindUserById.mockResolvedValue({ id: "user-2", email } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedFindInviteByToken.mockResolvedValue(pendingInvite() as never);
  mockedGetOptionalSession.mockResolvedValue(null);
  mockedIsOrganizationMember.mockResolvedValue(false);
  mockedLogout.mockResolvedValue(undefined as never);
});

describe("AcceptInvitePage", () => {
  it("shows invalid for an unknown token", async () => {
    mockedFindInviteByToken.mockResolvedValue(null);
    await renderPage();
    expect(screen.getByRole("heading", { name: "This invite link isn't valid" })).toBeInTheDocument();
  });

  it.each(["ACCEPTED", "REVOKED"])("shows invalid for a %s invite", async (status) => {
    mockedFindInviteByToken.mockResolvedValue(pendingInvite({ status }) as never);
    await renderPage();
    expect(screen.getByRole("heading", { name: "This invite link isn't valid" })).toBeInTheDocument();
  });

  it("shows expired, naming the inviter", async () => {
    mockedFindInviteByToken.mockResolvedValue(
      pendingInvite({ expiresAt: new Date(Date.now() - 1000) }) as never,
    );
    await renderPage();
    expect(screen.getByRole("heading", { name: "This invite has expired" })).toBeInTheDocument();
    expect(screen.getByText("Ask Alice to send you a new one.")).toBeInTheDocument();
  });

  it("shows who invited whom, to what, with which role", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { name: "Join Acme" })).toBeInTheDocument();
    expect(screen.getByText(/Alice invited/)).toHaveTextContent(
      "Alice invited bob@example.com to join Acme as a member.",
    );
  });

  it("offers Sign up and Log in that come back here with the email prefilled when logged out", async () => {
    await renderPage();
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      `/signup?${NEXT_AND_EMAIL}`,
    );
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      `/login?${NEXT_AND_EMAIL}`,
    );
    expect(screen.queryByRole("button", { name: /accept/ })).not.toBeInTheDocument();
  });

  it("asks a signed-in user with a different email to log out, returning to login", async () => {
    signedInAs("alice@example.com");
    await renderPage();

    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /accept/ })).not.toBeInTheDocument();

    screen.getByRole("button", { name: "Log out" }).click();
    await vi.waitFor(() =>
      expect(mockedLogout).toHaveBeenCalledWith(`/login?${NEXT_AND_EMAIL}`, expect.anything()),
    );
  });

  it("links an existing member to the organization instead of offering accept", async () => {
    signedInAs("bob@example.com");
    mockedIsOrganizationMember.mockResolvedValue(true);
    await renderPage();

    expect(screen.getByRole("heading", { name: "You're already in Acme" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Acme" })).toHaveAttribute("href", "/dashboard/acme");
  });

  it("shows Accept to the invited user, matching email case-insensitively", async () => {
    signedInAs(" Bob@Example.com");
    await renderPage();

    expect(mockedIsOrganizationMember).toHaveBeenCalledWith("user-2", "acme");
    expect(screen.getByRole("button", { name: "accept token-1" })).toBeInTheDocument();
  });
});
