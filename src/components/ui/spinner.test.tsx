import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner } from "./spinner";

describe("Spinner", () => {
  it("renders as a status role with an accessible label", () => {
    render(<Spinner />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("merges a custom className with the defaults", () => {
    render(<Spinner className="text-red-600" />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("animate-spin");
    expect(spinner).toHaveClass("text-red-600");
  });
});
