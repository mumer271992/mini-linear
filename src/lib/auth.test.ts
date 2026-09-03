import { describe, expect, it } from "vitest";
import { generatePasswordHash, verifyPasswordHash } from "./auth";

describe("generatePasswordHash / verifyPasswordHash", () => {
  it("produces a hash different from the plaintext password", async () => {
    const hash = await generatePasswordHash("correct horse battery staple");
    expect(hash).not.toBe("correct horse battery staple");
  });

  it("verifies the correct password against its own hash", async () => {
    const hash = await generatePasswordHash("correct horse battery staple");
    await expect(verifyPasswordHash("correct horse battery staple", hash)).resolves.toBe(
      true,
    );
  });

  it("rejects an incorrect password", async () => {
    const hash = await generatePasswordHash("correct horse battery staple");
    await expect(verifyPasswordHash("wrong password", hash)).resolves.toBe(false);
  });

  it("throws when the password exceeds 72 bytes", async () => {
    const tooLong = "a".repeat(73);
    await expect(generatePasswordHash(tooLong)).rejects.toThrow(
      "Password must be at most 72 bytes.",
    );
  });

  it("accepts a password at exactly 72 bytes", async () => {
    const exactly72 = "a".repeat(72);
    const hash = await generatePasswordHash(exactly72);
    expect(hash).toBeTypeOf("string");
  });
});
