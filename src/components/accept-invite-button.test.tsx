import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { acceptInvite } from "@/server/actions/invite";
import { AcceptInviteButton } from "./accept-invite-button";

vi.mock("@/server/actions/invite", () => ({ acceptInvite: vi.fn() }));

const mockedAcceptInvite = vi.mocked(acceptInvite);

describe("AcceptInviteButton", () => {
  it("calls acceptInvite with the token", async () => {
    mockedAcceptInvite.mockResolvedValue(undefined as never);
    const user = userEvent.setup();
    render(<AcceptInviteButton token="token-1" />);

    await user.click(screen.getByRole("button", { name: "Accept invite" }));

    expect(mockedAcceptInvite).toHaveBeenCalledWith("token-1");
  });

  it("shows the returned error and lets the user try again", async () => {
    mockedAcceptInvite.mockResolvedValue({ error: "This invite link isn't valid." });
    const user = userEvent.setup();
    render(<AcceptInviteButton token="token-1" />);

    await user.click(screen.getByRole("button", { name: "Accept invite" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("This invite link isn't valid.");
    expect(screen.getByRole("button", { name: "Accept invite" })).toBeEnabled();
  });
});
