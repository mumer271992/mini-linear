import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { getTaskStatusCounts, getTasksAssignedToUser } from "@/server/db/task";
import { MyTasksList } from "./my-tasks-list";

vi.mock("@/server/db/task", () => ({
  getTasksAssignedToUser: vi.fn(),
  getTaskStatusCounts: vi.fn(),
}));

const mockedGetTasksAssignedToUser = vi.mocked(getTasksAssignedToUser);
const mockedGetTaskStatusCounts = vi.mocked(getTaskStatusCounts);

describe("MyTasksList", () => {
  it("renders each task's title, project link, and status", async () => {
    mockedGetTasksAssignedToUser.mockResolvedValue([
      {
        id: "task-1",
        title: "Write copy",
        status: "TODO",
        project: { id: "project-1", name: "Website Redesign", slug: "website-redesign-abc" },
      },
    ] as never);
    mockedGetTaskStatusCounts.mockResolvedValue({ TODO: 1, IN_PROGRESS: 0, DONE: 0 });

    const list = await MyTasksList({ orgSlug: "acme", userId: "user-1" });
    render(list);

    expect(mockedGetTasksAssignedToUser).toHaveBeenCalledWith("acme", "user-1");
    expect(mockedGetTaskStatusCounts).toHaveBeenCalledWith("acme", "user-1");
    expect(screen.getByText("Write copy")).toBeInTheDocument();
    expect(screen.getByText("Todo")).toBeInTheDocument();

    const projectLink = screen.getByRole("link", { name: "Website Redesign" });
    expect(projectLink).toHaveAttribute(
      "href",
      "/dashboard/acme/projects/website-redesign-abc/tasks",
    );
  });

  it("shows an empty state when no tasks are assigned", async () => {
    mockedGetTasksAssignedToUser.mockResolvedValue([]);
    mockedGetTaskStatusCounts.mockResolvedValue({ TODO: 0, IN_PROGRESS: 0, DONE: 0 });

    const list = await MyTasksList({ orgSlug: "acme", userId: "user-1" });
    render(list);

    expect(screen.getByText("No tasks assigned to you yet.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
