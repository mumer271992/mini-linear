import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resendVerificationEmail } from "@/server/actions/auth";
import { ResendVerificationButton } from "./resend-verification-button";

vi.mock("@/server/actions/auth", () => ({ resendVerificationEmail: vi.fn() }));

const mockedResend = vi.mocked(resendVerificationEmail);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ResendVerificationButton", () => {
  it("confirms when the email was sent", async () => {
    mockedResend.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<ResendVerificationButton cooldownMinutes={5} />);

    await user.click(screen.getByRole("button", { name: "Resend email" }));

    expect(await screen.findByText("Sent! Check your inbox for a new link.")).toBeInTheDocument();
  });

  it("shows the action's error message", async () => {
    mockedResend.mockResolvedValue({ error: "Couldn't send the email. Please try again." });
    const user = userEvent.setup();
    render(<ResendVerificationButton cooldownMinutes={5} />);

    await user.click(screen.getByRole("button", { name: "Resend email" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't send the email.");
  });

  it("shows a generic message and re-enables when the action throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockedResend.mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();
    render(<ResendVerificationButton cooldownMinutes={5} />);

    await user.click(screen.getByRole("button", { name: "Resend email" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong.");
    expect(screen.getByRole("button", { name: "Resend email" })).toBeEnabled();
  });

  it("disables itself while sending", async () => {
    let finish!: (value: { success: true }) => void;
    mockedResend.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    render(<ResendVerificationButton cooldownMinutes={5} />);

    await user.click(screen.getByRole("button", { name: "Resend email" }));

    expect(screen.getByRole("button")).toBeDisabled();
    finish({ success: true });
    // By text, not role: the in-button <Spinner /> also has role="status".
    expect(await screen.findByText("Sent! Check your inbox for a new link.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resend email" })).toBeEnabled();
  });

  it("tells the user how often they can resend", () => {
    render(<ResendVerificationButton cooldownMinutes={5} />);

    expect(
      screen.getByText("You can request a new email once every 5 minutes."),
    ).toBeInTheDocument();
  });
});
