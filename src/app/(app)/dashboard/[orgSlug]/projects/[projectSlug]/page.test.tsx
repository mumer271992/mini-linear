import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { getOrganizationMembers } from "@/server/db/organization";
import { findProjectBySlug } from "@/server/db/project";
import ProjectOverviewPage from "./page";

vi.mock("@/server/db/organization", () => ({ getOrganizationMembers: vi.fn() }));
vi.mock("@/server/db/project", () => ({ findProjectBySlug: vi.fn() }));
vi.mock("@/server/actions/project", () => ({ updateProject: vi.fn() }));

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
});
