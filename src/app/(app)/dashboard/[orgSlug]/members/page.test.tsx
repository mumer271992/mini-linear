import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { verifySession } from "@/server/db/session";
import {
  getOrganizationMembersWithRoles,
  hasPermission,
  requireMembership,
} from "@/server/db/organization";
import MembersPage from "./page";

vi.mock("@/server/db/session", () => ({ verifySession: vi.fn() }));
vi.mock("@/server/db/organization", () => ({
  getOrganizationMembersWithRoles: vi.fn(),
  hasPermission: vi.fn(),
  requireMembership: vi.fn(),
}));
// InviteMemberButton has its own coverage (and needs the router) -- stub it.
vi.mock("@/components/invite-member-button", () => ({
  InviteMemberButton: () => <button type="button">+ New Member</button>,
}));

const mockedVerifySession = vi.mocked(verifySession);
const mockedHasPermission = vi.mocked(hasPermission);
const mockedRequireMembership = vi.mocked(requireMembership);
const mockedGetMembers = vi.mocked(getOrganizationMembersWithRoles);

async function renderPage() {
  const page = await MembersPage({
    params: Promise.resolve({ orgSlug: "acme" }),
  } as never);
  render(page);
}

describe("MembersPage", () => {
  beforeEach(() => {
    mockedVerifySession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
      lastOrganizationId: null,
    });
    mockedRequireMembership.mockResolvedValue({} as never);
    mockedHasPermission.mockReturnValue(true);
    mockedGetMembers.mockResolvedValue([]);
  });

  it("checks membership of the org in the URL", async () => {
    await renderPage();
    expect(mockedRequireMembership).toHaveBeenCalledWith("user-1", "acme");
  });

  it("renders the Members heading and New Member button", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Members" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ New Member" })).toBeInTheDocument();
  });

  it("hides New Member for roles without member:invite", async () => {
    mockedHasPermission.mockReturnValue(false);
    await renderPage();
    expect(mockedHasPermission).toHaveBeenCalledWith({}, "member:invite");
    expect(screen.queryByRole("button", { name: "+ New Member" })).not.toBeInTheDocument();
  });

  it("fetches members of the org in the URL and lists them with their roles", async () => {
    mockedGetMembers.mockResolvedValue([
      { id: "membership-1", name: "Alice", role: "owner" },
      { id: "membership-2", name: "Bob", role: "member" },
    ]);
    await renderPage();
    expect(mockedGetMembers).toHaveBeenCalledWith("acme");
    expect(screen.getByRole("row", { name: /Alice owner/ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Bob member/ })).toBeInTheDocument();
    expect(screen.queryByText("No members yet.")).not.toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    await renderPage();
    expect(screen.getByText("No members yet.")).toBeInTheDocument();
  });
});
