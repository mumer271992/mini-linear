import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { getTaskStatusCounts } from "@/server/db/task";
import { TaskStatusStats } from "./task-status-stats";

vi.mock("@/server/db/task", () => ({ getTaskStatusCounts: vi.fn() }));

const mockedGetTaskStatusCounts = vi.mocked(getTaskStatusCounts);

describe("TaskStatusStats", () => {
  it("renders Todo, In Progress, and Done boxes with their counts", async () => {
    mockedGetTaskStatusCounts.mockResolvedValue({ TODO: 3, IN_PROGRESS: 9, DONE: 57 });

    const stats = await TaskStatusStats({ orgSlug: "acme" });
    render(stats);

    expect(mockedGetTaskStatusCounts).toHaveBeenCalledWith("acme");
    expect(screen.getByText("Todo")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("57")).toBeInTheDocument();
  });

  it("renders zero counts without erroring", async () => {
    mockedGetTaskStatusCounts.mockResolvedValue({ TODO: 0, IN_PROGRESS: 0, DONE: 0 });

    const stats = await TaskStatusStats({ orgSlug: "acme" });
    render(stats);

    expect(screen.getAllByText("0")).toHaveLength(3);
  });
});
