import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { revokeMembership } from "@/server/actions/member";
import { RevokeMemberButton } from "./revoke-member-button";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/server/actions/member", () => ({ revokeMembership: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const mockedRevokeMembership = vi.mocked(revokeMembership);

function renderButton() {
  render(<RevokeMemberButton orgSlug="acme" membershipId="membership-2" memberName="Bob" />);
  return screen.getByRole("button", { name: "Revoke access for Bob" });
}

describe("RevokeMemberButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("shows a Revoke access tooltip on the button", () => {
    renderButton();
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent("Revoke access");
  });

  it("does nothing when the confirm dialog is cancelled", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const user = userEvent.setup();

    await user.click(renderButton());

    expect(window.confirm).toHaveBeenCalledWith("Remove Bob from this organization?");
    expect(mockedRevokeMembership).not.toHaveBeenCalled();
  });

  it("revokes the membership and refreshes the page on success", async () => {
    mockedRevokeMembership.mockResolvedValue(undefined);
    const user = userEvent.setup();

    await user.click(renderButton());

    expect(mockedRevokeMembership).toHaveBeenCalledWith("acme", "membership-2");
    expect(refresh).toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows the error, re-enables the button, and doesn't refresh on failure", async () => {
    mockedRevokeMembership.mockResolvedValue({ error: "This member has already been removed." });
    const user = userEvent.setup();

    const button = renderButton();
    await user.click(button);

    expect(toast.error).toHaveBeenCalledWith("This member has already been removed.");
    expect(refresh).not.toHaveBeenCalled();
    expect(button).toBeEnabled();
  });

  it("shows a generic error and re-enables the button when the action throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedRevokeMembership.mockRejectedValue(new Error("You do not have permission to perform this action."));
    const user = userEvent.setup();

    const button = renderButton();
    await user.click(button);

    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't remove this member. Refresh the page and try again.",
    );
    expect(consoleError).toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(button).toBeEnabled();
  });
});
