import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createProject } from "@/server/actions/project";
import { CreateProjectForm } from "./create-project-form";

vi.mock("@/server/actions/project", () => ({
  createProject: vi.fn(),
}));

const mockedCreateProject = vi.mocked(createProject);

const members = [
  { id: "user-1", name: "Alice" },
  { id: "user-2", name: "Bob" },
];

describe("CreateProjectForm", () => {
  it("renders the members list in the assignee dropdown, plus Unassigned", () => {
    render(<CreateProjectForm orgSlug="acme" members={members} />);

    expect(screen.getByRole("option", { name: "Unassigned" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Alice" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Bob" })).toBeInTheDocument();
  });

  it("defaults priority to Medium and status to Backlog", () => {
    render(<CreateProjectForm orgSlug="acme" members={members} />);

    expect(screen.getByLabelText("Priority")).toHaveValue("MEDIUM");
    expect(screen.getByLabelText("Status")).toHaveValue("BACKLOG");
  });

  it("shows a validation error instead of submitting when name is too short", async () => {
    const user = userEvent.setup();
    render(<CreateProjectForm orgSlug="acme" members={members} />);

    await user.type(screen.getByLabelText("Name"), "A");
    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(
      await screen.findByText("Project name must be at least 2 characters"),
    ).toBeInTheDocument();
    expect(mockedCreateProject).not.toHaveBeenCalled();
  });

  it("submits with defaults and undefined optional fields when only name is filled", async () => {
    mockedCreateProject.mockResolvedValue(undefined as never);
    const user = userEvent.setup();
    render(<CreateProjectForm orgSlug="acme" members={members} />);

    await user.type(screen.getByLabelText("Name"), "Website Redesign");
    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(mockedCreateProject).toHaveBeenCalledWith("acme", {
      name: "Website Redesign",
      summary: undefined,
      description: undefined,
      targetDate: undefined,
      assignedToId: undefined,
      priority: "MEDIUM",
      status: "BACKLOG",
    });
  });

  it("submits all fields when fully filled out", async () => {
    mockedCreateProject.mockResolvedValue(undefined as never);
    const user = userEvent.setup();
    render(<CreateProjectForm orgSlug="acme" members={members} />);

    await user.type(screen.getByLabelText("Name"), "Website Redesign");
    await user.type(screen.getByLabelText("Summary"), "A short summary");
    await user.type(screen.getByLabelText("Description"), "A longer description");
    // userEvent.type() doesn't reliably simulate segmented native date
    // inputs -- fireEvent.change sets the value directly, which is the
    // standard approach for date inputs in RTL.
    fireEvent.change(screen.getByLabelText("Target date"), {
      target: { value: "2026-12-01" },
    });
    await user.selectOptions(screen.getByLabelText("Assignee"), "user-2");
    await user.selectOptions(screen.getByLabelText("Priority"), "HIGH");
    await user.selectOptions(screen.getByLabelText("Status"), "IN_PROGRESS");
    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(mockedCreateProject).toHaveBeenCalledWith("acme", {
      name: "Website Redesign",
      summary: "A short summary",
      description: "A longer description",
      targetDate: "2026-12-01",
      assignedToId: "user-2",
      priority: "HIGH",
      status: "IN_PROGRESS",
    });
  });

  it("shows the server-returned error message", async () => {
    mockedCreateProject.mockResolvedValue({ error: "Something went wrong. Please try again." });
    const user = userEvent.setup();
    render(<CreateProjectForm orgSlug="acme" members={members} />);

    await user.type(screen.getByLabelText("Name"), "Website Redesign");
    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
  });
});
