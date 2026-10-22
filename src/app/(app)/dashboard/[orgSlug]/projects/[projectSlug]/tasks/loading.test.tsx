import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ProjectTasksLoading from "./loading";

describe("ProjectTasksLoading", () => {
  it("announces loading and shows the task table columns", () => {
    render(<ProjectTasksLoading />);
    expect(screen.getByRole("status", { name: "Loading tasks" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Assigned to" })).toBeInTheDocument();
  });
});
