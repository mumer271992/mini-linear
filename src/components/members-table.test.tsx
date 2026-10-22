import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MembersTable } from "./members-table";

// RevokeMemberButton has its own coverage (and needs the router) -- stub it.
vi.mock("@/components/revoke-member-button", () => ({
  RevokeMemberButton: ({ memberName }: { memberName: string }) => (
    <button type="button">Revoke access for {memberName}</button>
  ),
}));

const members = [
  { id: "1", name: "Sara Khan", role: "Admin" },
  { id: "2", name: "Daniel Ortiz", role: "Member" },
];

describe("MembersTable", () => {
  it("renders Name and Role column headers", () => {
    render(<MembersTable orgSlug="acme" members={[]} />);
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Role" })).toBeInTheDocument();
  });

  it("shows an empty state when there are no members", () => {
    render(<MembersTable orgSlug="acme" members={[]} />);
    expect(screen.getByText("No members yet.")).toBeInTheDocument();
  });

  it("renders a row per member with name and role", () => {
    render(<MembersTable orgSlug="acme" members={members} />);
    expect(screen.getByRole("cell", { name: "Sara Khan" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Member" })).toBeInTheDocument();
  });

  it("gives each row a Revoke access button with a matching tooltip", () => {
    render(<MembersTable orgSlug="acme" members={members} canRemove />);
    expect(screen.getAllByRole("button", { name: /Revoke access/ })).toHaveLength(2);
    screen
      .getAllByRole("tooltip", { hidden: true })
      .forEach((tooltip) => expect(tooltip).toHaveTextContent("Revoke access"));
  });

  it("shows no Revoke access buttons when the viewer can't remove members", () => {
    render(<MembersTable orgSlug="acme" members={members} />);
    expect(screen.queryByRole("button", { name: /Revoke access/ })).not.toBeInTheDocument();
  });

  it("hides the Revoke access button on the viewer's own row", () => {
    render(<MembersTable orgSlug="acme" members={members} currentMembershipId="1" canRemove />);
    expect(screen.getAllByRole("button", { name: /Revoke access/ })).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: "Revoke access for Sara Khan" }),
    ).not.toBeInTheDocument();
  });
});
