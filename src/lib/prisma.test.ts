import { describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { isRecordNotFoundError, isUniqueConstraintError } from "./prisma";

function makeKnownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("Simulated Prisma error", {
    code,
    clientVersion: "6.19.3",
  });
}

describe("isUniqueConstraintError", () => {
  it("returns true for a P2002 error", () => {
    expect(isUniqueConstraintError(makeKnownError("P2002"))).toBe(true);
  });

  it("returns false for a different Prisma error code", () => {
    expect(isUniqueConstraintError(makeKnownError("P2025"))).toBe(false);
  });

  it("returns false for a non-Prisma error", () => {
    expect(isUniqueConstraintError(new Error("boom"))).toBe(false);
  });
});

describe("isRecordNotFoundError", () => {
  it("returns true for a P2025 error", () => {
    expect(isRecordNotFoundError(makeKnownError("P2025"))).toBe(true);
  });

  it("returns false for a different Prisma error code", () => {
    expect(isRecordNotFoundError(makeKnownError("P2002"))).toBe(false);
  });

  it("returns false for a non-Prisma error", () => {
    expect(isRecordNotFoundError(new Error("boom"))).toBe(false);
  });
});
