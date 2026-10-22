import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "./error-state";

describe("ErrorState", () => {
  it("shows a generic message, never the raw error message", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorState error={new Error("connect ECONNREFUSED db:5432")} retry={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument();
  });

  it("shows the digest so it can be matched to server logs", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const error = Object.assign(new Error("boom"), { digest: "abc123" });
    render(<ErrorState error={error} retry={vi.fn()} />);

    expect(screen.getByText("Error ID: abc123")).toBeInTheDocument();
  });

  it("calls retry when Try again is clicked", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorState error={new Error("boom")} retry={retry} />);

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("links home by default, or to a custom destination", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { rerender } = render(<ErrorState error={new Error("boom")} retry={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Go to homepage" })).toHaveAttribute("href", "/");

    rerender(
      <ErrorState
        error={new Error("boom")}
        retry={vi.fn()}
        homeHref="/dashboard/acme"
        homeLabel="Go to overview"
      />,
    );
    expect(screen.getByRole("link", { name: "Go to overview" })).toHaveAttribute(
      "href",
      "/dashboard/acme",
    );
  });
});
