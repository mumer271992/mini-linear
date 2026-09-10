import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { verifySession } from "@/server/db/session";
import { requireMembership } from "@/server/db/organization";
import { getProjectsForOrganization } from "@/server/db/project";
import ProjectsPage from "./page";

vi.mock("@/server/db/session", () => ({ verifySession: vi.fn() }));
vi.mock("@/server/db/organization", () => ({ requireMembership: vi.fn() }));
vi.mock("@/server/db/project", () => ({ getProjectsForOrganization: vi.fn() }));

const mockedVerifySession = vi.mocked(verifySession);
const mockedRequireMembership = vi.mocked(requireMembership);
const mockedGetProjectsForOrganization = vi.mocked(getProjectsForOrganization);

describe("ProjectsPage breadcrumb", () => {
  it("shows a single, non-linked Projects crumb", async () => {
    mockedVerifySession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
      lastOrganizationId: null,
    });
    mockedRequireMembership.mockResolvedValue({} as never);
    mockedGetProjectsForOrganization.mockResolvedValue([]);

    const page = await ProjectsPage({
      params: Promise.resolve({ orgSlug: "acme" }),
    } as never);
    render(page);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const crumb = screen.getByText("Projects", { selector: "span" });
    expect(nav).toContainElement(crumb);
    expect(crumb).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Projects" })).not.toBeInTheDocument();
  });
});
