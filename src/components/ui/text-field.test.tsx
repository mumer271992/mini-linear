import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextField } from "./text-field";

describe("TextField", () => {
  it("associates the label with the input via htmlFor/id", () => {
    render(<TextField id="email" label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("shows the error message when provided", () => {
    render(<TextField id="email" label="Email" error="Required" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("renders no error text when error is not provided", () => {
    render(<TextField id="email" label="Email" />);
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });

  it("renders labelExtra alongside the label", () => {
    render(
      <TextField id="password" label="Password" labelExtra={<a href="/forgot">Forgot?</a>} />,
    );
    expect(screen.getByRole("link", { name: "Forgot?" })).toBeInTheDocument();
  });

  it("forwards standard input props like value and onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TextField id="name" label="Name" onChange={onChange} />);

    await user.type(screen.getByLabelText("Name"), "a");

    expect(onChange).toHaveBeenCalled();
  });

  it("forwards the ref to the underlying input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextField id="name" label="Name" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
