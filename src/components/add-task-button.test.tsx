import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { AddTaskButton } from "./add-task-button";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// CreateTaskForm has its own test coverage -- stub it here so this file only
// tests what's specific to this wrapper: open/close state and the
// close-always-refreshes wiring, including the onCreated -> close path.
vi.mock("@/components/create-task-form", () => ({
  CreateTaskForm: ({ onCreated }: { onCreated?: (task: { id: string }) => void }) => (
    <div>
      create task form
      <button onClick={() => onCreated?.({ id: "task-1" })}>simulate created</button>
    </div>
  ),
}));

const mockedUseRouter = vi.mocked(useRouter);

describe("AddTaskButton", () => {
  it("does not render the modal until clicked", () => {
    mockedUseRouter.mockReturnValue({ refresh: vi.fn() } as never);
    render(<AddTaskButton orgSlug="acme" projectSlug="website-redesign" members={[]} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the modal with the create task form when clicked", async () => {
    mockedUseRouter.mockReturnValue({ refresh: vi.fn() } as never);
    const user = userEvent.setup();
    render(<AddTaskButton orgSlug="acme" projectSlug="website-redesign" members={[]} />);

    await user.click(screen.getByRole("button", { name: "+ Add Task" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("create task form")).toBeInTheDocument();
  });

  it("closes the modal and refreshes when the modal's close button is clicked", async () => {
    const refresh = vi.fn();
    mockedUseRouter.mockReturnValue({ refresh } as never);
    const user = userEvent.setup();
    render(<AddTaskButton orgSlug="acme" projectSlug="website-redesign" members={[]} />);

    await user.click(screen.getByRole("button", { name: "+ Add Task" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("closes the modal and refreshes when a task is created", async () => {
    const refresh = vi.fn();
    mockedUseRouter.mockReturnValue({ refresh } as never);
    const user = userEvent.setup();
    render(<AddTaskButton orgSlug="acme" projectSlug="website-redesign" members={[]} />);

    await user.click(screen.getByRole("button", { name: "+ Add Task" }));
    await user.click(screen.getByRole("button", { name: "simulate created" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("reopens with a fresh form after being closed", async () => {
    mockedUseRouter.mockReturnValue({ refresh: vi.fn() } as never);
    const user = userEvent.setup();
    render(<AddTaskButton orgSlug="acme" projectSlug="website-redesign" members={[]} />);

    await user.click(screen.getByRole("button", { name: "+ Add Task" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: "+ Add Task" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
