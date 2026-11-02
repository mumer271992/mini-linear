import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db";
import { claimVerificationEmailSlot, markEmailVerified } from "./user";

vi.mock("@/server/db", () => ({
  prisma: { user: { updateMany: vi.fn() } },
}));

const mockedUpdateMany = vi.mocked(prisma.user.updateMany);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("markEmailVerified", () => {
  it("only sets the date when it isn't already set", async () => {
    await markEmailVerified("user-1");

    expect(mockedUpdateMany).toHaveBeenCalledWith({
      where: { id: "user-1", emailVerifiedAt: null },
      data: { emailVerifiedAt: expect.any(Date) },
    });
  });

  it("runs on the given transaction client instead of the global one", async () => {
    const tx = { user: { updateMany: vi.fn() } };

    await markEmailVerified("user-1", tx as never);

    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", emailVerifiedAt: null },
      data: { emailVerifiedAt: expect.any(Date) },
    });
    expect(mockedUpdateMany).not.toHaveBeenCalled();
  });
});

describe("claimVerificationEmailSlot", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("claims only for an unverified user whose last email is older than the cooldown", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
    mockedUpdateMany.mockResolvedValue({ count: 1 });

    await claimVerificationEmailSlot("user-1", 5 * 60 * 1000);

    expect(mockedUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "user-1",
        emailVerifiedAt: null,
        OR: [
          { verificationEmailSentAt: null },
          { verificationEmailSentAt: { lte: new Date("2026-11-01T11:55:00Z") } },
        ],
      },
      data: { verificationEmailSentAt: new Date("2026-11-01T12:00:00Z") },
    });
  });

  it("returns true when the slot was claimed", async () => {
    mockedUpdateMany.mockResolvedValue({ count: 1 });

    await expect(claimVerificationEmailSlot("user-1", 1000)).resolves.toBe(true);
  });

  it("returns false while cooling down (no row matched)", async () => {
    mockedUpdateMany.mockResolvedValue({ count: 0 });

    await expect(claimVerificationEmailSlot("user-1", 1000)).resolves.toBe(false);
  });
});

