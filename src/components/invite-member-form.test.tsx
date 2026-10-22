import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { inviteMember } from "@/server/actions/invite";
import { InviteMemberForm } from "./invite-member-form";

vi.mock("@/server/actions/invite", () => ({
  inviteMember: vi.fn(),
}));

const mockedInviteMember = vi.mocked(inviteMember);

describe("InviteMemberForm", () => {
  it("renders only an email field, with a note about the Member role", () => {
    render(<InviteMemberForm orgSlug="acme" />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText(/will join with the Member role/)).toBeInTheDocument();
  });

  it("shows a validation error for an invalid email and doesn't submit", async () => {
    const user = userEvent.setup();
    render(<InviteMemberForm orgSlug="acme" />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Send invite" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(mockedInviteMember).not.toHaveBeenCalled();
  });

  it("submits the email and calls onInvited on success", async () => {
    mockedInviteMember.mockResolvedValue({ invite: { id: "invite-1", email: "bob@example.com" } });
    const onInvited = vi.fn();
    const user = userEvent.setup();
    render(<InviteMemberForm orgSlug="acme" onInvited={onInvited} />);

    await user.type(screen.getByLabelText("Email"), "bob@example.com");
    await user.click(screen.getByRole("button", { name: "Send invite" }));

    expect(mockedInviteMember).toHaveBeenCalledWith("acme", { email: "bob@example.com" });
    expect(onInvited).toHaveBeenCalled();
  });

  it("shows the server error and stays open on failure", async () => {
    mockedInviteMember.mockResolvedValue({
      error: "This person is already a member of this organization.",
    });
    const onInvited = vi.fn();
    const user = userEvent.setup();
    render(<InviteMemberForm orgSlug="acme" onInvited={onInvited} />);

    await user.type(screen.getByLabelText("Email"), "bob@example.com");
    await user.click(screen.getByRole("button", { name: "Send invite" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This person is already a member of this organization.",
    );
    expect(onInvited).not.toHaveBeenCalled();
  });
});
