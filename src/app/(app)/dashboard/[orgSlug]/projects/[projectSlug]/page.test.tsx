import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { verifySession } from "@/server/db/session";
import { getOrganizationMembers, requireMembership } from "@/server/db/organization";
import { findProjectBySlug } from "@/server/db/project";
import ProjectDetailsPage from "./page";

vi.mock("@/server/db/session", () => ({ verifySession: vi.fn() }));
vi.mock("@/server/db/organization", () => ({
  requireMembership: vi.fn(),
  getOrganizationMembers: vi.fn(),
}));
vi.mock("@/server/db/project", () => ({ findProjectBySlug: vi.fn() }));
vi.mock("@/server/actions/project", () => ({ updateProject: vi.fn() }));

const mockedVerifySession = vi.mocked(verifySession);
const mockedRequireMembership = vi.mocked(requireMembership);
const mockedGetOrganizationMembers = vi.mocked(getOrganizationMembers);
const mockedFindProjectBySlug = vi.mocked(findProjectBySlug);

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

describe("ProjectDetailsPage breadcrumb", () => {
  it("links back to the Projects list and shows the project name as the current page", async () => {
    mockedVerifySession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
      lastOrganizationId: null,
    });
    mockedRequireMembership.mockResolvedValue({} as never);
    mockedGetOrganizationMembers.mockResolvedValue([]);
    mockedFindProjectBySlug.mockResolvedValue(fakeProject as never);

    const page = await ProjectDetailsPage({
      params: Promise.resolve({ orgSlug: "acme", projectSlug: "website-redesign-abc123" }),
    } as never);
    render(page);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const projectsLink = screen.getByRole("link", { name: "Projects" });
    expect(nav).toContainElement(projectsLink);
    expect(projectsLink).toHaveAttribute("href", "/dashboard/acme/projects");

    const currentCrumb = screen.getByText("Website Redesign", { selector: "span" });
    expect(currentCrumb).toHaveAttribute("aria-current", "page");
  });
});
