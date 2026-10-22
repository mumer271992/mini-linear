import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Skeleton, TableSkeleton } from "./skeleton";

describe("Skeleton", () => {
  it("is hidden from assistive tech", () => {
    const { container } = render(<Skeleton className="h-4 w-4" />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("TableSkeleton", () => {
  it("renders the real column headers and the requested number of placeholder rows", () => {
    render(<TableSkeleton columns={["Name", "Role"]} rows={3} />);

    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Role" })).toBeInTheDocument();
    // 1 header row + 3 body rows
    expect(screen.getAllByRole("row")).toHaveLength(4);
    expect(within(screen.getAllByRole("row")[1]).getAllByRole("cell")).toHaveLength(2);
  });
});
