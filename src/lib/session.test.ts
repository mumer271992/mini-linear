// @vitest-environment node
//
// jose's internal checks use `instanceof Uint8Array`, and jsdom's TextEncoder
// produces Uint8Array instances from a different global realm than Node's --
// this file does no DOM work anyway, so run it under the real Node environment.
import { describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "./session";

describe("signSessionToken / verifySessionToken", () => {
  it("round-trips a payload through sign and verify", async () => {
    const token = await signSessionToken({
      sessionId: "session-1",
      userId: "user-1",
    });

    const payload = await verifySessionToken(token);

    expect(payload?.sessionId).toBe("session-1");
    expect(payload?.userId).toBe("user-1");
  });

  it("returns null for a garbage token", async () => {
    await expect(verifySessionToken("not-a-real-token")).resolves.toBeNull();
  });

  it("returns null for a token signed with a different secret", async () => {
    const { SignJWT } = await import("jose");
    const wrongKey = new TextEncoder().encode("a-completely-different-secret");
    const tokenFromElsewhere = await new SignJWT({
      sessionId: "session-1",
      userId: "user-1",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + 60)
      .sign(wrongKey);

    await expect(verifySessionToken(tokenFromElsewhere)).resolves.toBeNull();
  });
});
