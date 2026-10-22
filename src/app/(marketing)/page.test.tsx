import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";
import { GITHUB_URL } from "@/lib/site";

describe("Home", () => {
  beforeEach(() => {
    // jsdom doesn't implement matchMedia; the hero's CyclingTaskRow reads it.
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the headline", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Track every task from backlog to done." }),
    ).toBeInTheDocument();
  });

  it("links both Create an account CTAs to signup", () => {
    render(<Home />);
    const links = screen.getAllByRole("link", { name: "Create an account" });
    expect(links).toHaveLength(2);
    links.forEach((link) => expect(link).toHaveAttribute("href", "/signup"));
  });

  it("links Log in to login", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });

  it("lists the workflow steps in order", () => {
    render(<Home />);
    const steps = screen.getAllByRole("listitem").map((item) => item.querySelector("p")?.textContent);
    expect(steps).toEqual(["Backlog", "Todo", "In Progress", "In Review", "Done"]);
  });

  it("links to the source on GitHub", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", GITHUB_URL);
  });
});
