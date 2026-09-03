import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AuthLayout from "./layout";

describe("AuthLayout", () => {
  it("renders children", () => {
    render(
      <AuthLayout>
        <p>form content</p>
      </AuthLayout>,
    );
    expect(screen.getByText("form content")).toBeInTheDocument();
  });

  it("renders the marketing panel copy", () => {
    render(<AuthLayout>{null}</AuthLayout>);
    expect(
      screen.getByText("Plan, track, and ship work — all in one place."),
    ).toBeInTheDocument();
  });
});
