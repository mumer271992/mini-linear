import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { verifySession } from "@/server/db/session";
import {
  findOrganizationBySlug,
  isEmailOrganizationMember,
  isOrganizationMember,
  requireMembership,
  requirePermission,
} from "@/server/db/organization";
import { findRoleByName } from "@/server/db/role";
import { findUserById } from "@/server/db/user";
import { acceptInvite as acceptInviteRecord, findInviteByToken, upsertInvite } from "@/server/db/invite";
import { sendInviteEmail } from "@/lib/email";
import { acceptInvite, inviteMember } from "./invite";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/server/db/session", () => ({ verifySession: vi.fn() }));
vi.mock("@/server/db/organization", () => ({
  findOrganizationBySlug: vi.fn(),
  isEmailOrganizationMember: vi.fn(),
  isOrganizationMember: vi.fn(),
  requireMembership: vi.fn(),
  requirePermission: vi.fn(),
}));
vi.mock("@/server/db/role", () => ({ findRoleByName: vi.fn() }));
vi.mock("@/server/db/user", () => ({ findUserById: vi.fn() }));
vi.mock("@/server/db/invite", () => ({
  acceptInvite: vi.fn(),
  findInviteByToken: vi.fn(),
  upsertInvite: vi.fn(),
}));
vi.mock("@/lib/email", () => ({ sendInviteEmail: vi.fn() }));

const mockedRedirect = vi.mocked(redirect);
const mockedVerifySession = vi.mocked(verifySession);
const mockedIsOrganizationMember = vi.mocked(isOrganizationMember);
const mockedAcceptInviteRecord = vi.mocked(acceptInviteRecord);
const mockedFindInviteByToken = vi.mocked(findInviteByToken);
const mockedFindOrganizationBySlug = vi.mocked(findOrganizationBySlug);
const mockedIsEmailOrganizationMember = vi.mocked(isEmailOrganizationMember);
const mockedRequireMembership = vi.mocked(requireMembership);
const mockedRequirePermission = vi.mocked(requirePermission);
const mockedFindRoleByName = vi.mocked(findRoleByName);
const mockedFindUserById = vi.mocked(findUserById);
const mockedUpsertInvite = vi.mocked(upsertInvite);
const mockedSendInviteEmail = vi.mocked(sendInviteEmail);

const fakeMembership = { id: "membership-1", role: { permissions: [] } };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("APP_URL", "https://mini-linear.test");
  vi.spyOn(console, "error").mockImplementation(() => {});

  mockedVerifySession.mockResolvedValue({
    sessionId: "session-1",
    userId: "user-1",
    lastOrganizationId: null,
  });
  mockedRequireMembership.mockResolvedValue(fakeMembership as never);
  mockedIsEmailOrganizationMember.mockResolvedValue(false);
  mockedFindOrganizationBySlug.mockResolvedValue({ id: "org-1", name: "Acme" } as never);
  mockedFindUserById.mockResolvedValue({ id: "user-1", name: "Alice" } as never);
  mockedFindRoleByName.mockResolvedValue({ id: "role-member" } as never);
  mockedUpsertInvite.mockResolvedValue({ id: "invite-1", email: "bob@example.com" } as never);
  mockedSendInviteEmail.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("inviteMember", () => {
  it("checks membership and the member:invite permission before anything else", async () => {
    await inviteMember("acme", { email: "bob@example.com" });

    expect(mockedRequireMembership).toHaveBeenCalledWith("user-1", "acme");
    expect(mockedRequirePermission).toHaveBeenCalledWith(fakeMembership, "member:invite");
  });

  it("rejects an invalid email without touching the database", async () => {
    const result = await inviteMember("acme", { email: "not-an-email" });

    expect(result).toEqual({ error: "Enter a valid email address." });
    expect(mockedUpsertInvite).not.toHaveBeenCalled();
  });

  it("rejects an email that already belongs to a member", async () => {
    mockedIsEmailOrganizationMember.mockResolvedValue(true);

    const result = await inviteMember("acme", { email: "bob@example.com" });

    expect(result).toEqual({ error: "This person is already a member of this organization." });
    expect(mockedUpsertInvite).not.toHaveBeenCalled();
  });

  it("normalizes the email before checking and saving it", async () => {
    await inviteMember("acme", { email: "  Bob@Example.COM " });

    expect(mockedIsEmailOrganizationMember).toHaveBeenCalledWith("bob@example.com", "acme");
    expect(mockedUpsertInvite.mock.calls[0][0].email).toBe("bob@example.com");
  });

  it("saves a pending invite with the Member role and a 7-day expiry", async () => {
    const before = Date.now();
    await inviteMember("acme", { email: "bob@example.com" });

    expect(mockedFindRoleByName).toHaveBeenCalledWith("Member");
    const data = mockedUpsertInvite.mock.calls[0][0];
    expect(data).toMatchObject({
      organizationId: "org-1",
      email: "bob@example.com",
      roleId: "role-member",
      invitedById: "user-1",
    });
    expect(data.token.length).toBeGreaterThanOrEqual(43);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(data.expiresAt.getTime()).toBeGreaterThanOrEqual(before + sevenDays);
    expect(data.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + sevenDays);
  });

  it("emails an accept link built from APP_URL and the saved token", async () => {
    await inviteMember("acme", { email: "bob@example.com" });

    const { token } = mockedUpsertInvite.mock.calls[0][0];
    expect(mockedSendInviteEmail).toHaveBeenCalledWith({
      to: "bob@example.com",
      organizationName: "Acme",
      inviterName: "Alice",
      acceptUrl: `https://mini-linear.test/invite/${token}`,
    });
  });

  it("returns the invite on success", async () => {
    const result = await inviteMember("acme", { email: "bob@example.com" });

    expect(result).toEqual({ invite: { id: "invite-1", email: "bob@example.com" } });
  });

  it("returns a generic error when the Member role is missing", async () => {
    mockedFindRoleByName.mockResolvedValue(null);

    const result = await inviteMember("acme", { email: "bob@example.com" });

    expect(result).toEqual({ error: "Something went wrong. Please try again." });
    expect(mockedUpsertInvite).not.toHaveBeenCalled();
  });

  it("returns a generic error when APP_URL isn't set", async () => {
    vi.stubEnv("APP_URL", "");

    const result = await inviteMember("acme", { email: "bob@example.com" });

    expect(result).toEqual({ error: "Something went wrong. Please try again." });
    expect(mockedUpsertInvite).not.toHaveBeenCalled();
  });

  it("returns a generic error when the email fails to send", async () => {
    mockedSendInviteEmail.mockRejectedValue(new Error("Resend down"));

    const result = await inviteMember("acme", { email: "bob@example.com" });

    expect(result).toEqual({ error: "Something went wrong. Please try again." });
  });
});

describe("acceptInvite", () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  function pendingInvite(overrides: Record<string, unknown> = {}) {
    return {
      id: "invite-1",
      email: "bob@example.com",
      roleId: "role-member",
      status: "PENDING",
      expiresAt: new Date(Date.now() + DAY_MS),
      organization: { id: "org-1", name: "Acme", slug: "acme" },
      invitedBy: { id: "user-1", name: "Alice" },
      role: { id: "role-member", name: "Member" },
      ...overrides,
    };
  }

  beforeEach(() => {
    mockedVerifySession.mockResolvedValue({
      sessionId: "session-2",
      userId: "user-2",
      lastOrganizationId: null,
    });
    mockedFindInviteByToken.mockResolvedValue(pendingInvite() as never);
    mockedFindUserById.mockResolvedValue({ id: "user-2", email: "bob@example.com" } as never);
    mockedIsOrganizationMember.mockResolvedValue(false);
    mockedAcceptInviteRecord.mockResolvedValue(true);
  });

  it("rejects an unknown token", async () => {
    mockedFindInviteByToken.mockResolvedValue(null);

    expect(await acceptInvite("nope")).toEqual({ error: "This invite link isn't valid." });
    expect(mockedAcceptInviteRecord).not.toHaveBeenCalled();
  });

  it.each(["ACCEPTED", "REVOKED"])("rejects an invite that is %s", async (status) => {
    mockedFindInviteByToken.mockResolvedValue(pendingInvite({ status }) as never);

    expect(await acceptInvite("token-1")).toEqual({ error: "This invite link isn't valid." });
    expect(mockedAcceptInviteRecord).not.toHaveBeenCalled();
  });

  it("rejects an expired invite, naming the inviter", async () => {
    mockedFindInviteByToken.mockResolvedValue(
      pendingInvite({ expiresAt: new Date(Date.now() - 1000) }) as never,
    );

    expect(await acceptInvite("token-1")).toEqual({
      error: "This invite has expired. Ask Alice to send a new one.",
    });
    expect(mockedAcceptInviteRecord).not.toHaveBeenCalled();
  });

  it("rejects a logged-in user whose email doesn't match the invite", async () => {
    mockedFindUserById.mockResolvedValue({ id: "user-2", email: "mallory@example.com" } as never);

    expect(await acceptInvite("token-1")).toEqual({
      error: "This invite was sent to a different email address.",
    });
    expect(mockedAcceptInviteRecord).not.toHaveBeenCalled();
  });

  it("matches emails case- and whitespace-insensitively", async () => {
    mockedFindUserById.mockResolvedValue({ id: "user-2", email: " Bob@Example.com" } as never);

    await acceptInvite("token-1");

    expect(mockedAcceptInviteRecord).toHaveBeenCalled();
  });

  it("rejects a user who is already a member", async () => {
    mockedIsOrganizationMember.mockResolvedValue(true);

    expect(await acceptInvite("token-1")).toEqual({
      error: "You're already a member of Acme.",
    });
    expect(mockedIsOrganizationMember).toHaveBeenCalledWith("user-2", "acme");
    expect(mockedAcceptInviteRecord).not.toHaveBeenCalled();
  });

  it("accepts with the invite's role and redirects into the organization", async () => {
    await acceptInvite("token-1");

    expect(mockedAcceptInviteRecord).toHaveBeenCalledWith({
      inviteId: "invite-1",
      userId: "user-2",
      organizationId: "org-1",
      roleId: "role-member",
    });
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard/acme");
  });

  it("returns invalid when the invite stopped being pending mid-request", async () => {
    mockedAcceptInviteRecord.mockResolvedValue(false);

    expect(await acceptInvite("token-1")).toEqual({ error: "This invite link isn't valid." });
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("treats a membership unique-constraint race as already a member", async () => {
    mockedAcceptInviteRecord.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6.19.3",
      }),
    );

    expect(await acceptInvite("token-1")).toEqual({
      error: "You're already a member of Acme.",
    });
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("returns a generic error on any other failure", async () => {
    mockedAcceptInviteRecord.mockRejectedValue(new Error("connection lost"));

    expect(await acceptInvite("token-1")).toEqual({
      error: "Something went wrong. Please try again.",
    });
    expect(mockedRedirect).not.toHaveBeenCalled();
  });
});
