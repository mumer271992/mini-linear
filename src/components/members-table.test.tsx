import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MembersTable } from "./members-table";

const members = [
  { id: "1", name: "Sara Khan", role: "Admin" },
  { id: "2", name: "Daniel Ortiz", role: "Member" },
];

describe("MembersTable", () => {
  it("renders Name and Role column headers", () => {
    render(<MembersTable members={[]} />);
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Role" })).toBeInTheDocument();
  });

  it("shows an empty state when there are no members", () => {
    render(<MembersTable members={[]} />);
    expect(screen.getByText("No members yet.")).toBeInTheDocument();
  });

  it("renders a row per member with name and role", () => {
    render(<MembersTable members={members} />);
    expect(screen.getByRole("cell", { name: "Sara Khan" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Member" })).toBeInTheDocument();
  });

  it("gives each row a Revoke access button with a matching tooltip", () => {
    render(<MembersTable members={members} />);
    expect(screen.getAllByRole("button", { name: "Revoke access" })).toHaveLength(2);
    screen
      .getAllByRole("tooltip", { hidden: true })
      .forEach((tooltip) => expect(tooltip).toHaveTextContent("Revoke access"));
  });
});
