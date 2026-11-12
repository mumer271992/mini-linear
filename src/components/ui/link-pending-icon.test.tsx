import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useLinkStatus } from "next/link";
import { LinkPendingIcon } from "./link-pending-icon";

vi.mock("next/link", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/link")>()),
  useLinkStatus: vi.fn(),
}));

const mockedUseLinkStatus = vi.mocked(useLinkStatus);

describe("LinkPendingIcon", () => {
  beforeEach(() => {
    mockedUseLinkStatus.mockReset();
  });

  it("shows only the icon when the link isn't navigating", () => {
    mockedUseLinkStatus.mockReturnValue({ pending: false });
    render(<LinkPendingIcon><svg data-testid="icon" /></LinkPendingIcon>);

    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("swaps the icon for a spinner after a delay while navigating", () => {
    mockedUseLinkStatus.mockReturnValue({ pending: true });
    render(<LinkPendingIcon><svg data-testid="icon" /></LinkPendingIcon>);

    // Both stay mounted -- the CSS animations do the delayed swap, so a fast
    // navigation finishes before the spinner ever becomes visible.
    expect(screen.getByTestId("icon").parentElement).toHaveClass(
      "animate-[link-pending-out_0s_100ms_forwards]",
    );
    const spinnerWrapper = screen.getByRole("status", { name: "Loading" }).parentElement;
    expect(spinnerWrapper).toHaveClass("opacity-0");
    expect(spinnerWrapper).toHaveClass("animate-[link-pending-in_150ms_ease_100ms_forwards]");
  });
});
