import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { deleteTask } from "@/server/actions/task";
import { TaskList } from "./task-list";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));
vi.mock("@/server/actions/task", () => ({
  deleteTask: vi.fn(),
}));

// EditTaskForm has its own coverage -- stub it here so this file only tests
// what's specific to TaskList: the edit/delete icon buttons and the
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
const mockedDeleteTask = vi.mocked(deleteTask);

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

  it("does not render the modal until the edit icon is clicked", () => {
    mockedUseRouter.mockReturnValue({ refresh: vi.fn() } as never);
    render(
      <TaskList orgSlug="acme" projectSlug="website-redesign" tasks={tasks as never} members={members} />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the edit modal for the clicked row's edit icon", async () => {
    mockedUseRouter.mockReturnValue({ refresh: vi.fn() } as never);
    const user = userEvent.setup();
    render(
      <TaskList orgSlug="acme" projectSlug="website-redesign" tasks={tasks as never} members={members} />,
    );

    await user.click(screen.getByRole("button", { name: "Edit Write copy" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("edit form for Write copy")).toBeInTheDocument();
  });

  it("opens the correct task's edit form when a different row's edit icon is clicked", async () => {
    mockedUseRouter.mockReturnValue({ refresh: vi.fn() } as never);
    const user = userEvent.setup();
    render(
      <TaskList orgSlug="acme" projectSlug="website-redesign" tasks={tasks as never} members={members} />,
    );

    await user.click(screen.getByRole("button", { name: "Edit Review designs" }));

    expect(screen.getByText("edit form for Review designs")).toBeInTheDocument();
  });

  it("closes the modal and refreshes when the modal's close button is clicked", async () => {
    const refresh = vi.fn();
    mockedUseRouter.mockReturnValue({ refresh } as never);
    const user = userEvent.setup();
    render(
      <TaskList orgSlug="acme" projectSlug="website-redesign" tasks={tasks as never} members={members} />,
    );

    await user.click(screen.getByRole("button", { name: "Edit Write copy" }));
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

    await user.click(screen.getByRole("button", { name: "Edit Write copy" }));
    await user.click(screen.getByRole("button", { name: "simulate updated" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("asks for confirmation and does not delete when the user cancels", async () => {
    const refresh = vi.fn();
    mockedUseRouter.mockReturnValue({ refresh } as never);
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(
      <TaskList orgSlug="acme" projectSlug="website-redesign" tasks={tasks as never} members={members} />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Write copy" }));

    expect(window.confirm).toHaveBeenCalledWith('Delete "Write copy"?');
    expect(mockedDeleteTask).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("deletes and refreshes when the user confirms", async () => {
    const refresh = vi.fn();
    mockedUseRouter.mockReturnValue({ refresh } as never);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedDeleteTask.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <TaskList orgSlug="acme" projectSlug="website-redesign" tasks={tasks as never} members={members} />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Write copy" }));

    expect(mockedDeleteTask).toHaveBeenCalledWith("acme", "website-redesign", "task-1");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("shows an alert and does not refresh when delete fails", async () => {
    const refresh = vi.fn();
    mockedUseRouter.mockReturnValue({ refresh } as never);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
    mockedDeleteTask.mockResolvedValue({ error: "This task no longer exists." });
    const user = userEvent.setup();
    render(
      <TaskList orgSlug="acme" projectSlug="website-redesign" tasks={tasks as never} members={members} />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Write copy" }));

    expect(window.alert).toHaveBeenCalledWith("This task no longer exists.");
    expect(refresh).not.toHaveBeenCalled();
  });
});
