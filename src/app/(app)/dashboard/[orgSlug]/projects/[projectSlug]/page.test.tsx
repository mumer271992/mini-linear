import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { verifySession } from "@/server/db/session";
import { getOrganizationMembers, requireMembership } from "@/server/db/organization";
import { findProjectBySlug } from "@/server/db/project";
import ProjectOverviewPage from "./page";

vi.mock("@/server/db/session", () => ({ verifySession: vi.fn() }));
vi.mock("@/server/db/organization", () => ({
  getOrganizationMembers: vi.fn(),
  requireMembership: vi.fn(),
}));
vi.mock("@/server/db/project", () => ({ findProjectBySlug: vi.fn() }));
vi.mock("@/server/actions/project", () => ({ updateProject: vi.fn() }));

const mockedGetOrganizationMembers = vi.mocked(getOrganizationMembers);
const mockedFindProjectBySlug = vi.mocked(findProjectBySlug);
const mockedVerifySession = vi.mocked(verifySession);
const mockedRequireMembership = vi.mocked(requireMembership);

beforeEach(() => {
  vi.clearAllMocks();
  mockedVerifySession.mockResolvedValue({
    sessionId: "session-1",
    userId: "user-1",
    lastOrganizationId: null,
  });
  mockedRequireMembership.mockResolvedValue({ id: "membership-1" } as never);
});

const fakeProject = {
  id: "project-1",
  name: "Website Redesign",
  slug: "website-redesign-abc123",
  summary: null,
  description: null,
  targetDate: null,
  priority: "MEDIUM",
  status: "BACKLOG",
  assignedToId: null,
};

describe("ProjectOverviewPage", () => {
  it("renders the edit form prefilled with the project's data", async () => {
    mockedFindProjectBySlug.mockResolvedValue(fakeProject as never);
    mockedGetOrganizationMembers.mockResolvedValue([]);

    const page = await ProjectOverviewPage({
      params: Promise.resolve({ orgSlug: "acme", projectSlug: "website-redesign-abc123" }),
    } as never);
    render(page);

    expect(screen.getByLabelText("Name")).toHaveValue("Website Redesign");
  });

  it("404s when the project doesn't exist", async () => {
    mockedFindProjectBySlug.mockResolvedValue(null);
    mockedGetOrganizationMembers.mockResolvedValue([]);

    await expect(
      ProjectOverviewPage({
        params: Promise.resolve({ orgSlug: "acme", projectSlug: "no-such-project" }),
      } as never),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("checks membership itself instead of relying on the layout", async () => {
    mockedFindProjectBySlug.mockResolvedValue(fakeProject as never);
    mockedGetOrganizationMembers.mockResolvedValue([]);

    await ProjectOverviewPage({
      params: Promise.resolve({ orgSlug: "acme", projectSlug: "website-redesign-abc123" }),
    } as never);

    expect(mockedRequireMembership).toHaveBeenCalledWith("user-1", "acme");
  });

  it("reads nothing when the session check fails", async () => {
    mockedVerifySession.mockRejectedValue(new Error("NEXT_REDIRECT:/verify-email"));

    await expect(
      ProjectOverviewPage({
        params: Promise.resolve({ orgSlug: "acme", projectSlug: "website-redesign-abc123" }),
      } as never),
    ).rejects.toThrow("NEXT_REDIRECT:/verify-email");
    expect(mockedFindProjectBySlug).not.toHaveBeenCalled();
    expect(mockedGetOrganizationMembers).not.toHaveBeenCalled();
  });

  it("reads nothing for a non-member", async () => {
    mockedRequireMembership.mockRejectedValue(new Error("You are not a member of this organization."));

    await expect(
      ProjectOverviewPage({
        params: Promise.resolve({ orgSlug: "other-org", projectSlug: "website-redesign-abc123" }),
      } as never),
    ).rejects.toThrow("not a member of this organization");
    expect(mockedFindProjectBySlug).not.toHaveBeenCalled();
    expect(mockedGetOrganizationMembers).not.toHaveBeenCalled();
  });
});
