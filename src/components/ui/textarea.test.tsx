import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("associates the label with the textarea via htmlFor/id", () => {
    render(<Textarea id="description" label="Description" />);
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("shows the error message when provided", () => {
    render(<Textarea id="description" label="Description" error="Required" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("renders no error text when error is not provided", () => {
    render(<Textarea id="description" label="Description" />);
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });

  it("forwards standard textarea props like value and onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Textarea id="description" label="Description" onChange={onChange} />);

    await user.type(screen.getByLabelText("Description"), "a");

    expect(onChange).toHaveBeenCalled();
  });

  it("forwards the ref to the underlying textarea element", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea id="description" label="Description" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("links the error message to the textarea for assistive tech when an error is present", () => {
    render(<Textarea id="description" label="Description" error="Required" />);

    const textarea = screen.getByLabelText("Description");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAttribute("aria-describedby", "description-error");
    expect(screen.getByText("Required")).toHaveAttribute("id", "description-error");
  });

  it("does not mark the textarea invalid or describe it when there's no error", () => {
    render(<Textarea id="description" label="Description" />);

    const textarea = screen.getByLabelText("Description");
    expect(textarea).toHaveAttribute("aria-invalid", "false");
    expect(textarea).not.toHaveAttribute("aria-describedby");
  });
});
