import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tooltip } from "./tooltip";

describe("Tooltip", () => {
  it("renders its children and the label as a tooltip", () => {
    render(
      <Tooltip label="Revoke access">
        <button type="button">trigger</button>
      </Tooltip>,
    );
    expect(screen.getByRole("button", { name: "trigger" })).toBeInTheDocument();
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent("Revoke access");
  });

  it("is hidden until hover or focus", () => {
    render(<Tooltip label="Hint">x</Tooltip>);
    const tooltip = screen.getByRole("tooltip", { hidden: true });
    expect(tooltip).toHaveClass("opacity-0");
    expect(tooltip).toHaveClass("group-hover/tooltip:opacity-100");
    expect(tooltip).toHaveClass("group-focus-within/tooltip:opacity-100");
  });

  it("places the tooltip above by default", () => {
    render(<Tooltip label="Hint">x</Tooltip>);
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveClass("bottom-full");
  });

  it("places the tooltip on the requested side", () => {
    render(
      <Tooltip label="Hint" side="left">
        x
      </Tooltip>,
    );
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveClass("right-full");
  });

  it("merges a custom className onto the wrapper", () => {
    const { container } = render(
      <Tooltip label="Hint" className="ml-2">
        x
      </Tooltip>,
    );
    expect(container.firstChild).toHaveClass("relative", "ml-2");
  });
});
