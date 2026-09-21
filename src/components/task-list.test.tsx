import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { TaskList } from "./task-list";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// EditTaskForm has its own coverage -- stub it here so this file only tests
// what's specific to TaskList: row click/keyboard opening the modal, and the
// close-always-refreshes wiring, including the onUpdated -> close path.
vi.mock("@/components/edit-task-form", () => ({
  EditTaskForm: ({ task, onUpdated }: { task: { title: string }; onUpdated?: (task: unknown) => void }) => (
    <div>
      edit form for {task.title}
      <button onClick={() => onUpdated?.(task)}>simulate updated</button>
    </div>
  ),
}));

const mockedUseRouter = vi.mocked(useRouter);

const members = [{ id: "user-1", name: "Alice" }];

const tasks = [
  { id: "task-1", title: "Write copy", status: "TODO", assignedTo: null },
  { id: "task-2", title: "Review designs", status: "DONE", assignedTo: { id: "user-1", name: "Alice" } },
];

describe("TaskList", () => {
  it("renders each task's title, assignee, and status", () => {
    mockedUseRouter.mockReturnValue({ refresh: vi.fn() } as never);
    render(
      <TaskList orgSlug="acme" projectSlug="website-redesign" tasks={tasks as never} members={members} />,
    );

    expect(screen.getByText("Write copy")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
    expect(screen.getByText("Review designs")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows the empty state instead of a table when there are no tasks", () => {
    mockedUseRouter.mockReturnValue({ refresh: vi.fn() } as never);
    render(<TaskList orgSlug="acme" projectSlug="website-redesign" tasks={[]} members={members} />);

    expect(screen.getByText("No tasks yet.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("does not render the modal until a row is clicked", () => {
    mockedUseRouter.mockReturnValue({ refresh: vi.fn() } as never);
    render(
      <TaskList orgSlug="acme" projectSlug="website-redesign" tasks={tasks as never} members={members} />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the edit modal for the clicked row", async () => {
    mockedUseRouter.mockReturnValue({ refresh: vi.fn() } as never);
    const user = userEvent.setup();
    render(
      <TaskList orgSlug="acme" projectSlug="website-redesign" tasks={tasks as never} members={members} />,
    );

    await user.click(screen.getByText("Write copy"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("edit form for Write copy")).toBeInTheDocument();
  });

  it("opens the edit modal via keyboard (Enter) on a focused row", async () => {
    mockedUseRouter.mockReturnValue({ refresh: vi.fn() } as never);
    const user = userEvent.setup();
    render(
      <TaskList orgSlug="acme" projectSlug="website-redesign" tasks={tasks as never} members={members} />,
    );

    screen.getByText("Write copy").closest("tr")?.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes the modal and refreshes when the modal's close button is clicked", async () => {
    const refresh = vi.fn();
    mockedUseRouter.mockReturnValue({ refresh } as never);
    const user = userEvent.setup();
    render(
      <TaskList orgSlug="acme" projectSlug="website-redesign" tasks={tasks as never} members={members} />,
    );

    await user.click(screen.getByText("Write copy"));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("closes the modal and refreshes when a task is updated", async () => {
    const refresh = vi.fn();
    mockedUseRouter.mockReturnValue({ refresh } as never);
    const user = userEvent.setup();
    render(
      <TaskList orgSlug="acme" projectSlug="website-redesign" tasks={tasks as never} members={members} />,
    );

    await user.click(screen.getByText("Write copy"));
    await user.click(screen.getByRole("button", { name: "simulate updated" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("opens the correct task's edit form when a different row is clicked", async () => {
    mockedUseRouter.mockReturnValue({ refresh: vi.fn() } as never);
    const user = userEvent.setup();
    render(
      <TaskList orgSlug="acme" projectSlug="website-redesign" tasks={tasks as never} members={members} />,
    );

    await user.click(screen.getByText("Review designs"));

    expect(screen.getByText("edit form for Review designs")).toBeInTheDocument();
  });
});
