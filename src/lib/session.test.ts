// @vitest-environment node
//
// jose's internal checks use `instanceof Uint8Array`, and jsdom's TextEncoder
// produces Uint8Array instances from a different global realm than Node's --
// this file does no DOM work anyway, so run it under the real Node environment.
import { describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { signSessionToken, verifySessionToken } from "./session";
import { signingKey } from "./signing-key";

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
    const wrongKey = new TextEncoder().encode("a-completely-different-secret");
    const tokenFromElsewhere = await new SignJWT({
      sessionId: "session-1",
      userId: "user-1",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setAudience("session")
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + 60)
      .sign(wrongKey);

    await expect(verifySessionToken(tokenFromElsewhere)).resolves.toBeNull();
  });

  // Cookies issued before sessions carried an audience fail here, which
  // logs those users out once -- an accepted, one-off cost.
  it("returns null for a token with no audience", async () => {
    const token = await new SignJWT({ sessionId: "session-1", userId: "user-1" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(Date.now() / 1000) + 60)
      .sign(signingKey);

    await expect(verifySessionToken(token)).resolves.toBeNull();
  });

  it("returns null for a token with a different audience", async () => {
    const token = await new SignJWT({ sessionId: "session-1", userId: "user-1" })
      .setProtectedHeader({ alg: "HS256" })
      .setAudience("email-verification")
      .setExpirationTime(Math.floor(Date.now() / 1000) + 60)
      .sign(signingKey);

    await expect(verifySessionToken(token)).resolves.toBeNull();
  });

  it("returns null for a session-audience token missing sessionId", async () => {
    const token = await new SignJWT({ userId: "user-1" })
      .setProtectedHeader({ alg: "HS256" })
      .setAudience("session")
      .setExpirationTime(Math.floor(Date.now() / 1000) + 60)
      .sign(signingKey);

    await expect(verifySessionToken(token)).resolves.toBeNull();
  });
});
