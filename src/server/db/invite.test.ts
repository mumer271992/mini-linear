import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db";
import { findOrganizationBySlug } from "@/server/db/organization";
import { acceptInvite, findInviteByToken, getInvitesForOrganization, upsertInvite } from "./invite";

vi.mock("@/server/db", () => ({
  prisma: {
    invite: { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/server/db/organization", () => ({ findOrganizationBySlug: vi.fn() }));

const mockedFindMany = vi.mocked(prisma.invite.findMany);
const mockedFindUnique = vi.mocked(prisma.invite.findUnique);
const mockedUpsert = vi.mocked(prisma.invite.upsert);
const mockedFindOrganizationBySlug = vi.mocked(findOrganizationBySlug);

function lastFindManyArgs() {
  return mockedFindMany.mock.calls[0][0]!;
}

function lastFindUniqueArgs() {
  return mockedFindUnique.mock.calls[0][0]!;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedFindOrganizationBySlug.mockResolvedValue({ id: "org-1" } as never);
  mockedFindMany.mockResolvedValue([]);
  mockedFindUnique.mockResolvedValue(null);
});

describe("getInvitesForOrganization", () => {
  it("throws when the organization doesn't exist", async () => {
    mockedFindOrganizationBySlug.mockResolvedValue(null);

    await expect(getInvitesForOrganization("no-such-org")).rejects.toThrow(
      "Organization not found.",
    );
    expect(mockedFindMany).not.toHaveBeenCalled();
  });

  it("scopes to the organization and pending status only", async () => {
    await getInvitesForOrganization("acme");

    const args = lastFindManyArgs();
    expect(args.where).toEqual({ organizationId: "org-1", status: "PENDING" });
  });

  it("includes role and invitedBy, ordered by createdAt desc", async () => {
    await getInvitesForOrganization("acme");

    const args = lastFindManyArgs();
    expect(args.include).toEqual({
      role: { select: { id: true, name: true } },
      invitedBy: { select: { id: true, name: true } },
    });
    expect(args.orderBy).toEqual({ createdAt: "desc" });
  });
});

describe("findInviteByToken", () => {
  it("looks up by token", async () => {
    await findInviteByToken("abc123");

    const args = lastFindUniqueArgs();
    expect(args.where).toEqual({ token: "abc123" });
  });

  it("includes organization, invitedBy, and role", async () => {
    await findInviteByToken("abc123");

    const args = lastFindUniqueArgs();
    expect(args.include).toEqual({
      organization: { select: { id: true, name: true, slug: true } },
      invitedBy: { select: { id: true, name: true } },
      role: { select: { id: true, name: true } },
    });
  });

  it("returns null when no invite matches, without throwing", async () => {
    mockedFindUnique.mockResolvedValue(null);

    await expect(findInviteByToken("no-such-token")).resolves.toBeNull();
  });

  it("does not require the organization to exist -- it's a public, unscoped lookup", async () => {
    mockedFindUnique.mockResolvedValue({ id: "invite-1" } as never);

    await findInviteByToken("abc123");

    expect(mockedFindOrganizationBySlug).not.toHaveBeenCalled();
  });
});

describe("upsertInvite", () => {
  const data = {
    organizationId: "org-1",
    email: "bob@example.com",
    roleId: "role-1",
    invitedById: "user-1",
    token: "token-1",
    expiresAt: new Date("2026-10-28T00:00:00Z"),
  };

  it("upserts on the org+email unique key", async () => {
    await upsertInvite(data);

    expect(mockedUpsert.mock.calls[0][0].where).toEqual({
      organizationId_email: { organizationId: "org-1", email: "bob@example.com" },
    });
  });

  it("creates a new row with every field", async () => {
    await upsertInvite(data);

    expect(mockedUpsert.mock.calls[0][0].create).toEqual(data);
  });

  it("refreshes token, expiry, role, and inviter on re-invite, and resets to PENDING", async () => {
    await upsertInvite(data);

    expect(mockedUpsert.mock.calls[0][0].update).toEqual({
      roleId: "role-1",
      invitedById: "user-1",
      token: "token-1",
      expiresAt: data.expiresAt,
      status: "PENDING",
    });
  });
});

describe("acceptInvite", () => {
  const tx = {
    invite: { updateMany: vi.fn() },
    membership: { create: vi.fn() },
    user: { updateMany: vi.fn() },
  };
  const data = { inviteId: "invite-1", userId: "user-2", organizationId: "org-1", roleId: "role-1" };

  beforeEach(() => {
    // Run the interactive-transaction callback against the fake tx client.
    vi.mocked(prisma.$transaction).mockImplementation(((fn: (client: typeof tx) => unknown) =>
      fn(tx)) as never);
    tx.invite.updateMany.mockResolvedValue({ count: 1 });
    tx.membership.create.mockResolvedValue({});
    tx.user.updateMany.mockResolvedValue({ count: 1 });
  });

  it("flips the invite to ACCEPTED only while it's still pending and unexpired", async () => {
    await acceptInvite(data);

    const args = tx.invite.updateMany.mock.calls[0][0];
    expect(args.where).toMatchObject({ id: "invite-1", status: "PENDING" });
    expect(args.where.expiresAt.gt).toBeInstanceOf(Date);
    expect(args.data).toEqual({ status: "ACCEPTED" });
  });

  it("creates the membership with the invite's role", async () => {
    await acceptInvite(data);

    expect(tx.membership.create).toHaveBeenCalledWith({
      data: { userId: "user-2", organizationId: "org-1", roleId: "role-1" },
    });
  });

  it("sets emailVerifiedAt only if it isn't already set", async () => {
    await acceptInvite(data);

    const args = tx.user.updateMany.mock.calls[0][0];
    expect(args.where).toEqual({ id: "user-2", emailVerifiedAt: null });
    expect(args.data.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it("returns true on success", async () => {
    expect(await acceptInvite(data)).toBe(true);
  });

  it("returns false and writes nothing else when the invite is no longer acceptable", async () => {
    tx.invite.updateMany.mockResolvedValue({ count: 0 });

    expect(await acceptInvite(data)).toBe(false);
    expect(tx.membership.create).not.toHaveBeenCalled();
    expect(tx.user.updateMany).not.toHaveBeenCalled();
  });

  it("lets a membership insert failure throw so the transaction rolls back", async () => {
    tx.membership.create.mockRejectedValue(new Error("unique violation"));

    await expect(acceptInvite(data)).rejects.toThrow("unique violation");
    expect(tx.user.updateMany).not.toHaveBeenCalled();
  });
});
