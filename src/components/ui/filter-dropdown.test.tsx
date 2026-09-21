import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterDropdown } from "./filter-dropdown";

const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C" },
];

describe("FilterDropdown", () => {
  it("renders closed, with the plain label and no checkboxes visible", () => {
    render(<FilterDropdown label="Status" options={options} />);

    expect(screen.getByRole("button", { name: "Status" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("opens the checkbox list when the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<FilterDropdown label="Status" options={options} />);

    await user.click(screen.getByRole("button", { name: "Status" }));

    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
  });

  it("does not change the trigger label just from checking a box", async () => {
    const user = userEvent.setup();
    render(<FilterDropdown label="Status" options={options} />);

    await user.click(screen.getByRole("button", { name: "Status" }));
    await user.click(screen.getByLabelText("Option A"));

    expect(screen.getByRole("button", { name: "Status" })).toBeInTheDocument();
  });

  it("commits the selection and updates the trigger label when Apply is clicked", async () => {
    const user = userEvent.setup();
    render(<FilterDropdown label="Status" options={options} />);

    await user.click(screen.getByRole("button", { name: "Status" }));
    await user.click(screen.getByLabelText("Option A"));
    await user.click(screen.getByLabelText("Option B"));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(
      screen.getByRole("button", { name: "Status: Option A, Option B" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("calls onApply with the applied values", async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();
    render(<FilterDropdown label="Status" options={options} onApply={onApply} />);

    await user.click(screen.getByRole("button", { name: "Status" }));
    await user.click(screen.getByLabelText("Option C"));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(onApply).toHaveBeenCalledWith(["c"]);
  });

  it("reopens with the previously applied options still checked", async () => {
    const user = userEvent.setup();
    render(<FilterDropdown label="Status" options={options} />);

    await user.click(screen.getByRole("button", { name: "Status" }));
    await user.click(screen.getByLabelText("Option A"));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    await user.click(screen.getByRole("button", { name: "Status: Option A" }));

    expect(screen.getByLabelText("Option A")).toBeChecked();
    expect(screen.getByLabelText("Option B")).not.toBeChecked();
  });

  it("discards unapplied changes when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <FilterDropdown label="Status" options={options} />
        <p>outside</p>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Status" }));
    await user.click(screen.getByLabelText("Option A"));
    await user.click(screen.getByText("outside"));

    expect(screen.getByRole("button", { name: "Status" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

    // Reopening should show nothing checked -- the click on "Option A" was
    // never applied, so it must not have leaked into the next open.
    await user.click(screen.getByRole("button", { name: "Status" }));
    expect(screen.getByLabelText("Option A")).not.toBeChecked();
  });

  it("discards unapplied changes when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<FilterDropdown label="Status" options={options} />);

    await user.click(screen.getByRole("button", { name: "Status" }));
    await user.click(screen.getByLabelText("Option A"));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Status" })).toBeInTheDocument();
  });

  it("does not close when clicking inside the dropdown panel", async () => {
    const user = userEvent.setup();
    render(<FilterDropdown label="Status" options={options} />);

    await user.click(screen.getByRole("button", { name: "Status" }));
    await user.click(screen.getByText("Option A"));

    expect(screen.getByRole("checkbox", { name: "Option A" })).toBeInTheDocument();
  });

  it("does not render a clear button when no filters are applied", () => {
    render(<FilterDropdown label="Status" options={options} />);

    expect(screen.queryByRole("button", { name: "Clear Status filter" })).not.toBeInTheDocument();
  });

  it("shows a clear button once a filter is applied", async () => {
    const user = userEvent.setup();
    render(<FilterDropdown label="Status" options={options} />);

    await user.click(screen.getByRole("button", { name: "Status" }));
    await user.click(screen.getByLabelText("Option A"));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(screen.getByRole("button", { name: "Clear Status filter" })).toBeInTheDocument();
  });

  it("clears the applied filter and calls onApply with an empty array", async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();
    render(<FilterDropdown label="Status" options={options} onApply={onApply} />);

    await user.click(screen.getByRole("button", { name: "Status" }));
    await user.click(screen.getByLabelText("Option A"));
    await user.click(screen.getByRole("button", { name: "Apply" }));
    onApply.mockClear();

    await user.click(screen.getByRole("button", { name: "Clear Status filter" }));

    expect(screen.getByRole("button", { name: "Status" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear Status filter" })).not.toBeInTheDocument();
    expect(onApply).toHaveBeenCalledWith([]);
  });

  it("clearing does not toggle the dropdown open", async () => {
    const user = userEvent.setup();
    render(<FilterDropdown label="Status" options={options} />);

    await user.click(screen.getByRole("button", { name: "Status" }));
    await user.click(screen.getByLabelText("Option A"));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    await user.click(screen.getByRole("button", { name: "Clear Status filter" }));

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("reopening after a clear shows nothing checked", async () => {
    const user = userEvent.setup();
    render(<FilterDropdown label="Status" options={options} />);

    await user.click(screen.getByRole("button", { name: "Status" }));
    await user.click(screen.getByLabelText("Option A"));
    await user.click(screen.getByRole("button", { name: "Apply" }));
    await user.click(screen.getByRole("button", { name: "Clear Status filter" }));

    await user.click(screen.getByRole("button", { name: "Status" }));

    expect(screen.getByLabelText("Option A")).not.toBeChecked();
  });
});
