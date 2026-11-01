import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db";
import { markEmailVerified } from "./user";

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
