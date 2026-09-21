import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { getOrganizationMembers } from "@/server/db/organization";
import ProjectTasksPage from "./page";

vi.mock("@/server/db/organization", () => ({ getOrganizationMembers: vi.fn() }));

// TasksContainer is itself an async Server Component -- React's plain client
// renderer (what RTL uses here) can only resolve the one async component we
// manually await ourselves below, not a nested one. Stub it, matching how
// create-project-modal.test.tsx stubs CreateProjectForm, so this test only
// checks what's specific to this page: fetching members and passing props
// through correctly.
vi.mock("@/components/tasks-container", () => ({
  TasksContainer: ({
    orgSlug,
    projectSlug,
    members,
  }: {
    orgSlug: string;
    projectSlug: string;
    members: { id: string; name: string }[];
  }) => (
    <div>
      tasks container for {orgSlug}/{projectSlug}, {members.length} member(s)
    </div>
  ),
}));

const mockedGetOrganizationMembers = vi.mocked(getOrganizationMembers);

describe("ProjectTasksPage", () => {
  it("fetches org members and renders TasksContainer with the right props", async () => {
    mockedGetOrganizationMembers.mockResolvedValue([{ id: "user-1", name: "Alice" }]);

    const page = await ProjectTasksPage({
      params: Promise.resolve({ orgSlug: "acme", projectSlug: "website-redesign-abc123" }),
    } as never);
    render(page);

    expect(mockedGetOrganizationMembers).toHaveBeenCalledWith("acme");
    expect(
      screen.getByText("tasks container for acme/website-redesign-abc123, 1 member(s)"),
    ).toBeInTheDocument();
  });
});
