import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "./select";

describe("Select", () => {
  it("associates the label with the select via htmlFor/id", () => {
    render(
      <Select id="priority" label="Priority">
        <option value="LOW">Low</option>
      </Select>,
    );
    expect(screen.getByLabelText("Priority")).toBeInTheDocument();
  });

  it("shows the error message when provided", () => {
    render(
      <Select id="priority" label="Priority" error="Required">
        <option value="LOW">Low</option>
      </Select>,
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("renders the provided options", () => {
    render(
      <Select id="priority" label="Priority">
        <option value="LOW">Low</option>
        <option value="HIGH">High</option>
      </Select>,
    );
    expect(screen.getByRole("option", { name: "Low" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "High" })).toBeInTheDocument();
  });

  it("calls onChange and updates the selected value", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Select id="priority" label="Priority" onChange={onChange}>
        <option value="LOW">Low</option>
        <option value="HIGH">High</option>
      </Select>,
    );

    await user.selectOptions(screen.getByLabelText("Priority"), "HIGH");

    expect(onChange).toHaveBeenCalled();
    expect(screen.getByLabelText("Priority")).toHaveValue("HIGH");
  });

  it("forwards the ref to the underlying select element", () => {
    const ref = createRef<HTMLSelectElement>();
    render(
      <Select id="priority" label="Priority" ref={ref}>
        <option value="LOW">Low</option>
      </Select>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });

  it("links the error message to the select for assistive tech when an error is present", () => {
    render(
      <Select id="priority" label="Priority" error="Required">
        <option value="LOW">Low</option>
      </Select>,
    );

    const select = screen.getByLabelText("Priority");
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAttribute("aria-describedby", "priority-error");
    expect(screen.getByText("Required")).toHaveAttribute("id", "priority-error");
  });

  it("does not mark the select invalid or describe it when there's no error", () => {
    render(
      <Select id="priority" label="Priority">
        <option value="LOW">Low</option>
      </Select>,
    );

    const select = screen.getByLabelText("Priority");
    expect(select).toHaveAttribute("aria-invalid", "false");
    expect(select).not.toHaveAttribute("aria-describedby");
  });
});
