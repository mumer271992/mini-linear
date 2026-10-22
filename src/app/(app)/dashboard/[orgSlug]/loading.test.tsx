import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import OrganizationDashboardLoading from "./loading";
import ProjectsLoading from "./projects/loading";
import MembersLoading from "./members/loading";

// All three dashboard skeletons in one file -- they're static markup, so the
// only behaviour worth pinning is that each announces itself and keeps the
// real table headers.
describe("dashboard loading skeletons", () => {
  it("overview announces loading and shows the My Tasks columns", () => {
    render(<OrganizationDashboardLoading />);
    expect(screen.getByRole("status", { name: "Loading overview" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Title" })).toBeInTheDocument();
  });

  it("projects announces loading and shows the projects columns", () => {
    render(<ProjectsLoading />);
    expect(screen.getByRole("status", { name: "Loading projects" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Target date" })).toBeInTheDocument();
  });

  it("members announces loading and shows the members columns", () => {
    render(<MembersLoading />);
    expect(screen.getByRole("status", { name: "Loading members" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Role" })).toBeInTheDocument();
  });
});
