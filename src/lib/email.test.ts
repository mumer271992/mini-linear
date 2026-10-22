import { beforeEach, describe, expect, it, vi } from "vitest";
import { InviteEmail } from "@/emails/invite-email";
import { sendInviteEmail } from "./email";

// email.tsx instantiates `new Resend(apiKey)` once at module load, so the
// mock constructor always has to hand back the same mockSend reference --
// otherwise each call site would get its own disconnected mock. vi.mock()
// factories are hoisted above regular statements, so mockSend has to be
// declared via vi.hoisted() to exist by the time the factory runs.
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

beforeEach(() => {
  mockSend.mockReset();
});

const params = {
  to: "invitee@example.com",
  organizationName: "Acme Studio",
  inviterName: "Sara Malik",
  acceptUrl: "https://example.com/invite/abc123",
};

describe("sendInviteEmail", () => {
  it("sends to the right address with the configured from and a descriptive subject", async () => {
    mockSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

    await sendInviteEmail(params);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const [args] = mockSend.mock.calls[0];
    expect(args.to).toBe("invitee@example.com");
    // Matches RESEND_FROM_EMAIL set in vitest.config.ts.
    expect(args.from).toBe("Mini Linear <test@example.com>");
    expect(args.subject).toBe("Sara Malik invited you to join Acme Studio on Mini Linear");
  });

  it("renders InviteEmail with the given props as the react payload", async () => {
    mockSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

    await sendInviteEmail(params);

    const [args] = mockSend.mock.calls[0];
    expect(args.react.type).toBe(InviteEmail);
    expect(args.react.props).toEqual({
      organizationName: "Acme Studio",
      inviterName: "Sara Malik",
      acceptUrl: "https://example.com/invite/abc123",
    });
  });

  it("throws a descriptive error when Resend reports a failure", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "Invalid from address" } });

    await expect(sendInviteEmail(params)).rejects.toThrow(
      "Failed to send invite email: Invalid from address",
    );
  });

  it("does not throw when the send succeeds", async () => {
    mockSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

    await expect(sendInviteEmail(params)).resolves.toBeUndefined();
  });
});
