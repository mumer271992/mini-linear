import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { verifySession, setSessionOrganization } from "@/server/db/session";
import { findOrganizationBySlug, requireMembership } from "@/server/db/organization";
import OrganizationDashboardPage from "./page";

vi.mock("@/server/db/session", () => ({
  verifySession: vi.fn(),
  setSessionOrganization: vi.fn(),
}));
vi.mock("@/server/db/organization", () => ({
  findOrganizationBySlug: vi.fn(),
  requireMembership: vi.fn(),
}));

// TaskStatusStats is itself an async Server Component -- React's plain
// client renderer (what RTL uses here) can only resolve the one async
// component we manually await ourselves below, not a nested one. Stub it,
// matching the pattern used for TasksContainer in tasks/page.test.tsx.
vi.mock("@/components/task-status-stats", () => ({
  TaskStatusStats: ({ orgSlug }: { orgSlug: string }) => <div>stats for {orgSlug}</div>,
}));
vi.mock("@/components/my-tasks-list", () => ({
  MyTasksList: ({ orgSlug, userId }: { orgSlug: string; userId: string }) => (
    <div>
      my tasks for {userId} in {orgSlug}
    </div>
  ),
}));

const mockedVerifySession = vi.mocked(verifySession);
const mockedSetSessionOrganization = vi.mocked(setSessionOrganization);
const mockedFindOrganizationBySlug = vi.mocked(findOrganizationBySlug);
const mockedRequireMembership = vi.mocked(requireMembership);

describe("OrganizationDashboardPage", () => {
  it("renders the welcome heading and the task status stats", async () => {
    mockedVerifySession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
      lastOrganizationId: null,
    });
    mockedFindOrganizationBySlug.mockResolvedValue({
      id: "org-1",
      name: "Acme Studio",
      slug: "acme",
    } as never);
    mockedRequireMembership.mockResolvedValue({} as never);

    const page = await OrganizationDashboardPage({
      params: Promise.resolve({ orgSlug: "acme" }),
    } as never);
    render(page);

    expect(screen.getByText("Welcome to Acme Studio")).toBeInTheDocument();
    expect(screen.getByText("stats for acme")).toBeInTheDocument();
    expect(screen.getByText("my tasks for user-1 in acme")).toBeInTheDocument();
    expect(mockedSetSessionOrganization).toHaveBeenCalledWith("session-1", "org-1");
  });

  it("404s when the organization doesn't exist", async () => {
    mockedVerifySession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
      lastOrganizationId: null,
    });
    mockedFindOrganizationBySlug.mockResolvedValue(null);

    await expect(
      OrganizationDashboardPage({
        params: Promise.resolve({ orgSlug: "no-such-org" }),
      } as never),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
