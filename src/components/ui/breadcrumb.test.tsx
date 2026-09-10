import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumb } from "./breadcrumb";

describe("Breadcrumb", () => {
  it("renders a labeled navigation landmark", () => {
    render(<Breadcrumb items={[{ label: "Projects" }]} />);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders an item with href as a link", () => {
    render(
      <Breadcrumb
        items={[{ label: "Projects", href: "/dashboard/acme/projects" }, { label: "Website Redesign" }]}
      />,
    );

    const link = screen.getByRole("link", { name: "Projects" });
    expect(link).toHaveAttribute("href", "/dashboard/acme/projects");
  });

  it("renders an item without href as the current page, not a link", () => {
    render(
      <Breadcrumb
        items={[{ label: "Projects", href: "/dashboard/acme/projects" }, { label: "Website Redesign" }]}
      />,
    );

    const current = screen.getByText("Website Redesign");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Website Redesign" })).not.toBeInTheDocument();
  });

  it("renders no separator for a single item", () => {
    render(<Breadcrumb items={[{ label: "Projects" }]} />);
    expect(screen.queryByText("/")).not.toBeInTheDocument();
  });

  it("renders a separator between multiple items", () => {
    render(
      <Breadcrumb
        items={[{ label: "Projects", href: "/dashboard/acme/projects" }, { label: "Website Redesign" }]}
      />,
    );
    expect(screen.getByText("/")).toBeInTheDocument();
  });

  it("applies the given className to the nav element", () => {
    render(<Breadcrumb items={[{ label: "Projects" }]} className="mb-2" />);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveClass("mb-2");
  });

  it("gives the current-page item its emphasized color even as the only item", () => {
    render(<Breadcrumb items={[{ label: "Projects" }]} />);
    expect(screen.getByText("Projects")).toHaveClass("text-zinc-950");
  });
});
