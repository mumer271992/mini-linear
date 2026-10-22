import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import { TaskFilters } from "./task-filters";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

const mockedUsePathname = vi.mocked(usePathname);

const PATHNAME = "/dashboard/acme/projects/website-redesign/tasks";

// TaskFilters navigates via window.location.assign() (see the comment in
// task-filters.tsx for why router.push()/replace() aren't used). jsdom
// doesn't implement real navigation, so assign() is spied on rather than
// asserting on window.location.href afterward.
let assignSpy: ReturnType<typeof vi.fn>;

function setCurrentSearch(search: string) {
  window.location.search = search;
}

beforeEach(() => {
  mockedUsePathname.mockReturnValue(PATHNAME);
  assignSpy = vi.fn();
  // jsdom's real Location doesn't implement navigation and locks down
  // `assign` (patching just that one property throws even with
  // configurable: true), so this replaces the whole `window.location`
  // property with a minimal mock rather than trying to patch the real one.
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { assign: assignSpy, search: "" },
  });
});

describe("TaskFilters", () => {
  it("renders a Status filter with every task status as an option", async () => {
    const user = userEvent.setup();
    render(<TaskFilters members={[]} appliedStatuses={[]} appliedAssigneeIds={[]} />);

    await user.click(screen.getByRole("button", { name: "Status" }));

    expect(screen.getByText("Backlog")).toBeInTheDocument();
    expect(screen.getByText("Todo")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("In Review")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("renders an Assignee filter with Unassigned plus each org member", async () => {
    const user = userEvent.setup();
    render(
      <TaskFilters
        members={[{ id: "user-1", name: "Alice" }]}
        appliedStatuses={[]}
        appliedAssigneeIds={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Assignee" }));

    expect(screen.getByText("Unassigned")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("reflects already-applied filters (e.g. from a shared link) in the trigger label", () => {
    render(
      <TaskFilters
        members={[{ id: "user-1", name: "Alice" }]}
        appliedStatuses={["BACKLOG", "TODO"]}
        appliedAssigneeIds={["user-1"]}
      />,
    );

    expect(screen.getByRole("button", { name: "Status: Backlog, Todo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assignee: Alice" })).toBeInTheDocument();
  });

  it("navigates with a status query param when the Status filter is applied", async () => {
    const user = userEvent.setup();
    render(<TaskFilters members={[]} appliedStatuses={[]} appliedAssigneeIds={[]} />);

    await user.click(screen.getByRole("button", { name: "Status" }));
    await user.click(screen.getByLabelText("Backlog"));
    await user.click(screen.getByLabelText("Todo"));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(assignSpy).toHaveBeenCalledWith(`${PATHNAME}?status=BACKLOG%2CTODO`);
  });

  it("navigates with an assignee query param when the Assignee filter is applied", async () => {
    const user = userEvent.setup();
    render(
      <TaskFilters
        members={[{ id: "user-1", name: "Alice" }]}
        appliedStatuses={[]}
        appliedAssigneeIds={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Assignee" }));
    await user.click(screen.getByLabelText("Unassigned"));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(assignSpy).toHaveBeenCalledWith(`${PATHNAME}?assignee=unassigned`);
  });

  it("preserves the other filter's existing query param when applying one filter", async () => {
    setCurrentSearch("?status=DONE");
    const user = userEvent.setup();
    render(
      <TaskFilters
        members={[{ id: "user-1", name: "Alice" }]}
        appliedStatuses={["DONE"]}
        appliedAssigneeIds={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Assignee" }));
    await user.click(screen.getByLabelText("Alice"));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    const url = new URL(assignSpy.mock.calls[0][0] as string, "http://localhost");
    expect(url.searchParams.get("status")).toBe("DONE");
    expect(url.searchParams.get("assignee")).toBe("user-1");
  });

  it("navigates to a clean pathname when a filter is cleared to empty", async () => {
    setCurrentSearch("?status=DONE");
    const user = userEvent.setup();
    render(<TaskFilters members={[]} appliedStatuses={["DONE"]} appliedAssigneeIds={[]} />);

    await user.click(screen.getByRole("button", { name: "Status: Done" }));
    await user.click(screen.getByLabelText("Done"));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(assignSpy).toHaveBeenCalledWith(PATHNAME);
  });
});
