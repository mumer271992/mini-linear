import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getMyTasks } from "@/server/actions/task";
import { MyTasksTable } from "./my-tasks-table";

vi.mock("@/server/actions/task", () => ({ getMyTasks: vi.fn() }));

const mockedGetMyTasks = vi.mocked(getMyTasks);

const writeCopy = {
  id: "task-1",
  title: "Write copy",
  status: "TODO",
  project: { id: "project-1", name: "Website Redesign", slug: "website-redesign" },
};
const reviewDesigns = {
  id: "task-2",
  title: "Review designs",
  status: "IN_PROGRESS",
  project: { id: "project-1", name: "Website Redesign", slug: "website-redesign" },
};
const shipReleaseNotes = {
  id: "task-3",
  title: "Ship release notes",
  status: "DONE",
  project: { id: "project-2", name: "Mobile App", slug: "mobile-app" },
};
const draftOnboardingCopy = {
  id: "task-4",
  title: "Draft onboarding copy",
  status: "TODO",
  project: { id: "project-2", name: "Mobile App", slug: "mobile-app" },
};

const tasks = [writeCopy, reviewDesigns, shipReleaseNotes, draftOnboardingCopy] as never;
const counts = { TODO: 2, IN_PROGRESS: 1, DONE: 1 };

describe("MyTasksTable", () => {
  it("shows every task and correct counts on the canned filter pills by default", () => {
    render(<MyTasksTable orgSlug="acme" initialTasks={tasks} counts={counts} />);

    expect(screen.getByText("Write copy")).toBeInTheDocument();
    expect(screen.getByText("Review designs")).toBeInTheDocument();
    expect(screen.getByText("Ship release notes")).toBeInTheDocument();
    expect(screen.getByText("Draft onboarding copy")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "All (4)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Todo (2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "In Progress (1)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done (1)" })).toBeInTheDocument();
  });

  it("calls getMyTasks and swaps in the result when the Todo pill is clicked", async () => {
    mockedGetMyTasks.mockResolvedValue([writeCopy, draftOnboardingCopy] as never);
    const user = userEvent.setup();
    render(<MyTasksTable orgSlug="acme" initialTasks={tasks} counts={counts} />);

    await user.click(screen.getByRole("button", { name: "Todo (2)" }));

    expect(mockedGetMyTasks).toHaveBeenCalledWith("acme", "TODO");
    expect(await screen.findByText("Write copy")).toBeInTheDocument();
    expect(screen.getByText("Draft onboarding copy")).toBeInTheDocument();
    expect(screen.queryByText("Review designs")).not.toBeInTheDocument();
    expect(screen.queryByText("Ship release notes")).not.toBeInTheDocument();
  });

  it("calls getMyTasks with no status when All is clicked after a filter", async () => {
    mockedGetMyTasks
      .mockResolvedValueOnce([shipReleaseNotes] as never)
      .mockResolvedValueOnce(tasks);
    const user = userEvent.setup();
    render(<MyTasksTable orgSlug="acme" initialTasks={tasks} counts={counts} />);

    await user.click(screen.getByRole("button", { name: "Done (1)" }));
    expect(await screen.findByText("Ship release notes")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All (4)" }));

    expect(mockedGetMyTasks).toHaveBeenLastCalledWith("acme", undefined);
    expect(await screen.findByText("Write copy")).toBeInTheDocument();
    expect(screen.getByText("Review designs")).toBeInTheDocument();
    expect(screen.getByText("Draft onboarding copy")).toBeInTheDocument();
  });

  it("shows a no-match message when a filter's fetch returns nothing", async () => {
    mockedGetMyTasks.mockResolvedValue([]);
    const user = userEvent.setup();
    render(
      <MyTasksTable
        orgSlug="acme"
        initialTasks={[writeCopy] as never}
        counts={{ TODO: 1, IN_PROGRESS: 0, DONE: 0 }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Done (0)" }));

    expect(await screen.findByText("No tasks match this filter.")).toBeInTheDocument();
  });

  it("shows the assigned-to-you empty state when there are no tasks at all", () => {
    render(
      <MyTasksTable orgSlug="acme" initialTasks={[]} counts={{ TODO: 0, IN_PROGRESS: 0, DONE: 0 }} />,
    );

    expect(screen.getByText("No tasks assigned to you yet.")).toBeInTheDocument();
  });

  it("hides the canned filter pills when there are no tasks at all", () => {
    render(
      <MyTasksTable orgSlug="acme" initialTasks={[]} counts={{ TODO: 0, IN_PROGRESS: 0, DONE: 0 }} />,
    );

    expect(screen.queryByRole("button", { name: /All/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Todo/ })).not.toBeInTheDocument();
  });

  it("keeps the filter pills visible when a filter matches nothing but tasks exist", async () => {
    mockedGetMyTasks.mockResolvedValue([]);
    const user = userEvent.setup();
    render(
      <MyTasksTable
        orgSlug="acme"
        initialTasks={[writeCopy] as never}
        counts={{ TODO: 1, IN_PROGRESS: 0, DONE: 0 }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Done (0)" }));

    expect(await screen.findByRole("button", { name: "All (1)" })).toBeInTheDocument();
  });

  it("disables the pills while a fetch is in flight", async () => {
    let resolveFetch!: (value: unknown) => void;
    mockedGetMyTasks.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }) as never,
    );
    const user = userEvent.setup();
    render(<MyTasksTable orgSlug="acme" initialTasks={tasks} counts={counts} />);

    await user.click(screen.getByRole("button", { name: "Done (1)" }));
    expect(screen.getByRole("button", { name: "All (4)" })).toBeDisabled();

    resolveFetch([shipReleaseNotes]);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "All (4)" })).not.toBeDisabled();
    });
  });

  it("links each task's project to that project's Tasks page", () => {
    render(<MyTasksTable orgSlug="acme" initialTasks={tasks} counts={counts} />);

    expect(screen.getAllByRole("link", { name: "Website Redesign" })[0]).toHaveAttribute(
      "href",
      "/dashboard/acme/projects/website-redesign/tasks",
    );
  });
});
