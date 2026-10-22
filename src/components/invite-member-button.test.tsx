import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { InviteMemberButton } from "./invite-member-button";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// InviteMemberForm has its own coverage -- stub it so this only tests the
// open/close wiring.
vi.mock("@/components/invite-member-form", () => ({
  InviteMemberForm: ({ onInvited }: { onInvited?: () => void }) => (
    <div>
      invite member form
      <button onClick={() => onInvited?.()}>simulate invited</button>
    </div>
  ),
}));

const mockedUseRouter = vi.mocked(useRouter);

describe("InviteMemberButton", () => {
  it("does not render the modal until clicked", () => {
    mockedUseRouter.mockReturnValue({ refresh: vi.fn() } as never);
    render(<InviteMemberButton orgSlug="acme" />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the modal with the invite form when clicked", async () => {
    mockedUseRouter.mockReturnValue({ refresh: vi.fn() } as never);
    const user = userEvent.setup();
    render(<InviteMemberButton orgSlug="acme" />);

    await user.click(screen.getByRole("button", { name: "+ New Member" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("invite member form")).toBeInTheDocument();
  });

  it("closes and refreshes after a successful invite", async () => {
    const refresh = vi.fn();
    mockedUseRouter.mockReturnValue({ refresh } as never);
    const user = userEvent.setup();
    render(<InviteMemberButton orgSlug="acme" />);

    await user.click(screen.getByRole("button", { name: "+ New Member" }));
    await user.click(screen.getByRole("button", { name: "simulate invited" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });
});
