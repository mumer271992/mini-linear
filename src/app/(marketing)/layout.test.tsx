import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import MarketingLayout from "./layout";

describe("MarketingLayout", () => {
  it("renders the logo linking home", () => {
    render(<MarketingLayout>{null}</MarketingLayout>);
    expect(screen.getByRole("link", { name: "Mini Linear" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("renders Login and Sign up nav links", () => {
    render(<MarketingLayout>{null}</MarketingLayout>);
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  it("renders children inside main", () => {
    render(
      <MarketingLayout>
        <p>page content</p>
      </MarketingLayout>,
    );
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("renders the current year in the footer", () => {
    render(<MarketingLayout>{null}</MarketingLayout>);
    expect(
      screen.getByText(`© ${new Date().getFullYear()} Mini Linear`),
    ).toBeInTheDocument();
  });
});
