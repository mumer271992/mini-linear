import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { getOrganizationMembers } from "@/server/db/organization";
import ProjectTasksPage from "./page";

vi.mock("@/server/db/organization", () => ({ getOrganizationMembers: vi.fn() }));

// TasksContainer is itself an async Server Component -- React's plain client
// renderer (what RTL uses here) can only resolve the one async component we
// manually await ourselves below, not a nested one. Stub it, matching how
// create-project-modal.test.tsx stubs CreateProjectForm, so this test only
// checks what's specific to this page: fetching members, parsing
// searchParams, and passing props through correctly.
vi.mock("@/components/tasks-container", () => ({
  TasksContainer: ({
    orgSlug,
    projectSlug,
    members,
    appliedStatuses,
    appliedAssigneeIds,
  }: {
    orgSlug: string;
    projectSlug: string;
    members: { id: string; name: string }[];
    appliedStatuses: string[];
    appliedAssigneeIds: string[];
  }) => (
    <div>
      tasks container for {orgSlug}/{projectSlug}, {members.length} member(s), statuses=
      {appliedStatuses.join("|")}, assignees={appliedAssigneeIds.join("|")}
    </div>
  ),
}));

const mockedGetOrganizationMembers = vi.mocked(getOrganizationMembers);

describe("ProjectTasksPage", () => {
  it("fetches org members and renders TasksContainer when there are no filters", async () => {
    mockedGetOrganizationMembers.mockResolvedValue([{ id: "user-1", name: "Alice" }]);

    const page = await ProjectTasksPage({
      params: Promise.resolve({ orgSlug: "acme", projectSlug: "website-redesign-abc123" }),
      searchParams: Promise.resolve({}),
    } as never);
    render(page);

    expect(mockedGetOrganizationMembers).toHaveBeenCalledWith("acme");
    expect(
      screen.getByText(
        "tasks container for acme/website-redesign-abc123, 1 member(s), statuses=, assignees=",
      ),
    ).toBeInTheDocument();
  });

  it("parses comma-separated status and assignee query params", async () => {
    mockedGetOrganizationMembers.mockResolvedValue([]);

    const page = await ProjectTasksPage({
      params: Promise.resolve({ orgSlug: "acme", projectSlug: "website-redesign-abc123" }),
      searchParams: Promise.resolve({ status: "BACKLOG,TODO", assignee: "user-1,unassigned" }),
    } as never);
    render(page);

    expect(
      screen.getByText(
        "tasks container for acme/website-redesign-abc123, 0 member(s), statuses=BACKLOG|TODO, assignees=user-1|unassigned",
      ),
    ).toBeInTheDocument();
  });

  it("discards a status query param value that isn't a real TaskStatus", async () => {
    mockedGetOrganizationMembers.mockResolvedValue([]);

    const page = await ProjectTasksPage({
      params: Promise.resolve({ orgSlug: "acme", projectSlug: "website-redesign-abc123" }),
      searchParams: Promise.resolve({ status: "BACKLOG,NOT_A_REAL_STATUS" }),
    } as never);
    render(page);

    expect(
      screen.getByText(
        "tasks container for acme/website-redesign-abc123, 0 member(s), statuses=BACKLOG, assignees=",
      ),
    ).toBeInTheDocument();
  });
});
