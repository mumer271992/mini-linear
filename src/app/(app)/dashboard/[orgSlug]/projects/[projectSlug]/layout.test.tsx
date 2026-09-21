import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { verifySession } from "@/server/db/session";
import { requireMembership } from "@/server/db/organization";
import { findProjectBySlug } from "@/server/db/project";
import ProjectDetailLayout from "./layout";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    usePathname: vi.fn(),
  };
});
vi.mock("@/server/db/session", () => ({ verifySession: vi.fn() }));
vi.mock("@/server/db/organization", () => ({ requireMembership: vi.fn() }));
vi.mock("@/server/db/project", () => ({ findProjectBySlug: vi.fn() }));

const mockedUsePathname = vi.mocked(usePathname);
const mockedVerifySession = vi.mocked(verifySession);
const mockedRequireMembership = vi.mocked(requireMembership);
const mockedFindProjectBySlug = vi.mocked(findProjectBySlug);

const fakeProject = { id: "project-1", name: "Website Redesign" };

describe("ProjectDetailLayout", () => {
  it("checks membership before fetching the project", async () => {
    mockedVerifySession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
      lastOrganizationId: null,
    });
    mockedRequireMembership.mockResolvedValue({} as never);
    mockedFindProjectBySlug.mockResolvedValue(fakeProject as never);
    mockedUsePathname.mockReturnValue("/dashboard/acme/projects/website-redesign-abc123");

    await ProjectDetailLayout({
      params: Promise.resolve({ orgSlug: "acme", projectSlug: "website-redesign-abc123" }),
      children: null,
    } as never);

    expect(mockedRequireMembership).toHaveBeenCalledWith("user-1", "acme");
  });

  it("links back to the Projects list and shows the project name as the current page", async () => {
    mockedVerifySession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
      lastOrganizationId: null,
    });
    mockedRequireMembership.mockResolvedValue({} as never);
    mockedFindProjectBySlug.mockResolvedValue(fakeProject as never);
    mockedUsePathname.mockReturnValue("/dashboard/acme/projects/website-redesign-abc123");

    const layout = await ProjectDetailLayout({
      params: Promise.resolve({ orgSlug: "acme", projectSlug: "website-redesign-abc123" }),
      children: <p>panel content</p>,
    } as never);
    render(layout);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const projectsLink = screen.getByRole("link", { name: "Projects" });
    expect(nav).toContainElement(projectsLink);
    expect(projectsLink).toHaveAttribute("href", "/dashboard/acme/projects");

    const currentCrumb = screen.getByText("Website Redesign", { selector: "span" });
    expect(currentCrumb).toHaveAttribute("aria-current", "page");
  });

  it("renders the tab links and the given children", async () => {
    mockedVerifySession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
      lastOrganizationId: null,
    });
    mockedRequireMembership.mockResolvedValue({} as never);
    mockedFindProjectBySlug.mockResolvedValue(fakeProject as never);
    mockedUsePathname.mockReturnValue("/dashboard/acme/projects/website-redesign-abc123");

    const layout = await ProjectDetailLayout({
      params: Promise.resolve({ orgSlug: "acme", projectSlug: "website-redesign-abc123" }),
      children: <p>panel content</p>,
    } as never);
    render(layout);

    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/dashboard/acme/projects/website-redesign-abc123",
    );
    expect(screen.getByRole("link", { name: "Tasks" })).toHaveAttribute(
      "href",
      "/dashboard/acme/projects/website-redesign-abc123/tasks",
    );
    expect(screen.getByText("panel content")).toBeInTheDocument();
  });

  it("404s when the project doesn't exist", async () => {
    mockedVerifySession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
      lastOrganizationId: null,
    });
    mockedRequireMembership.mockResolvedValue({} as never);
    mockedFindProjectBySlug.mockResolvedValue(null);

    await expect(
      ProjectDetailLayout({
        params: Promise.resolve({ orgSlug: "acme", projectSlug: "no-such-project" }),
        children: null,
      } as never),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
