import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db";
import {
  deleteMembership,
  getOrganizationMembers,
  getOrganizationMembersWithRoles,
  hasPermission,
  isEmailOrganizationMember,
  isOrganizationMember,
  requireMembership,
  requirePermission,
} from "./organization";

vi.mock("@/server/db", () => ({
  prisma: {
    organization: { findUnique: vi.fn() },
    membership: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const mockedFindOrganization = vi.mocked(prisma.organization.findUnique);
const mockedFindMembership = vi.mocked(prisma.membership.findUnique);
const mockedFindManyMemberships = vi.mocked(prisma.membership.findMany);
const mockedFindFirstMembership = vi.mocked(prisma.membership.findFirst);
const mockedDeleteMembership = vi.mocked(prisma.membership.delete);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireMembership", () => {
  it("throws when the organization doesn't exist", async () => {
    mockedFindOrganization.mockResolvedValue(null);

    await expect(requireMembership("user-1", "no-such-org")).rejects.toThrow(
      "Organization not found.",
    );
    expect(mockedFindMembership).not.toHaveBeenCalled();
  });

  it("throws when the user has no membership in an existing organization", async () => {
    mockedFindOrganization.mockResolvedValue({ id: "org-1" } as never);
    mockedFindMembership.mockResolvedValue(null);

    await expect(requireMembership("user-1", "acme")).rejects.toThrow(
      "You are not a member of this organization.",
    );
  });

  it("returns the membership when it exists", async () => {
    mockedFindOrganization.mockResolvedValue({ id: "org-1" } as never);
    const membership = { id: "membership-1", role: { permissions: ["project:create"] } };
    mockedFindMembership.mockResolvedValue(membership as never);

    await expect(requireMembership("user-1", "acme")).resolves.toBe(membership);
  });
});

describe("isOrganizationMember", () => {
  it("returns false when the organization doesn't exist", async () => {
    mockedFindOrganization.mockResolvedValue(null);

    await expect(isOrganizationMember("user-1", "no-such-org")).resolves.toBe(false);
    expect(mockedFindMembership).not.toHaveBeenCalled();
  });

  it("returns false when the user has no membership in the organization", async () => {
    mockedFindOrganization.mockResolvedValue({ id: "org-1" } as never);
    mockedFindMembership.mockResolvedValue(null);

    await expect(isOrganizationMember("user-1", "acme")).resolves.toBe(false);
  });

  it("returns true when the user is a member", async () => {
    mockedFindOrganization.mockResolvedValue({ id: "org-1" } as never);
    mockedFindMembership.mockResolvedValue({ id: "membership-1" } as never);

    await expect(isOrganizationMember("user-1", "acme")).resolves.toBe(true);
  });
});

describe("getOrganizationMembers", () => {
  it("throws when the organization doesn't exist", async () => {
    mockedFindOrganization.mockResolvedValue(null);

    await expect(getOrganizationMembers("no-such-org")).rejects.toThrow(
      "Organization not found.",
    );
    expect(mockedFindManyMemberships).not.toHaveBeenCalled();
  });

  it("returns each member's user record", async () => {
    mockedFindOrganization.mockResolvedValue({ id: "org-1" } as never);
    mockedFindManyMemberships.mockResolvedValue([
      { user: { id: "user-1", name: "Alice" } },
      { user: { id: "user-2", name: "Bob" } },
    ] as never);

    await expect(getOrganizationMembers("acme")).resolves.toEqual([
      { id: "user-1", name: "Alice" },
      { id: "user-2", name: "Bob" },
    ]);
  });
});

describe("getOrganizationMembersWithRoles", () => {
  it("throws when the organization doesn't exist", async () => {
    mockedFindOrganization.mockResolvedValue(null);

    await expect(getOrganizationMembersWithRoles("no-such-org")).rejects.toThrow(
      "Organization not found.",
    );
    expect(mockedFindManyMemberships).not.toHaveBeenCalled();
  });

  it("returns each membership with the user's name and role name", async () => {
    mockedFindOrganization.mockResolvedValue({ id: "org-1" } as never);
    mockedFindManyMemberships.mockResolvedValue([
      { id: "membership-1", user: { name: "Alice" }, role: { name: "owner" } },
      { id: "membership-2", user: { name: "Bob" }, role: { name: "member" } },
    ] as never);

    await expect(getOrganizationMembersWithRoles("acme")).resolves.toEqual([
      { id: "membership-1", name: "Alice", role: "owner" },
      { id: "membership-2", name: "Bob", role: "member" },
    ]);
    expect(mockedFindManyMemberships).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: "org-1" } }),
    );
  });
});

describe("deleteMembership", () => {
  it("throws when the organization doesn't exist", async () => {
    mockedFindOrganization.mockResolvedValue(null);

    await expect(deleteMembership("no-such-org", "membership-2")).rejects.toThrow(
      "Organization not found.",
    );
    expect(mockedDeleteMembership).not.toHaveBeenCalled();
  });

  it("deletes the membership scoped to the organization", async () => {
    mockedFindOrganization.mockResolvedValue({ id: "org-1" } as never);
    mockedDeleteMembership.mockResolvedValue({} as never);

    await deleteMembership("acme", "membership-2");

    expect(mockedDeleteMembership).toHaveBeenCalledWith({
      where: { id: "membership-2", organizationId: "org-1" },
    });
  });
});

describe("requirePermission", () => {
  const membershipWith = (permissions: unknown) =>
    ({ role: { permissions } }) as Parameters<typeof requirePermission>[0];

  it("does not throw when the permission is present", () => {
    expect(() =>
      requirePermission(membershipWith(["project:create", "project:read"]), "project:create"),
    ).not.toThrow();
  });

  it("throws when the permission is missing", () => {
    expect(() =>
      requirePermission(membershipWith(["project:read"]), "project:delete"),
    ).toThrow("You do not have permission to perform this action.");
  });

  it("throws rather than crashing when permissions isn't a real array", () => {
    expect(() =>
      requirePermission(membershipWith(null), "project:create"),
    ).toThrow("You do not have permission to perform this action.");
  });
});

describe("hasPermission", () => {
  const membershipWith = (permissions: unknown) =>
    ({ role: { permissions } }) as Parameters<typeof hasPermission>[0];

  it("returns true when the permission is present", () => {
    expect(hasPermission(membershipWith(["member:invite"]), "member:invite")).toBe(true);
  });

  it("returns false when the permission is missing", () => {
    expect(hasPermission(membershipWith(["project:read"]), "member:invite")).toBe(false);
  });

  it("returns false rather than crashing when permissions isn't a real array", () => {
    expect(hasPermission(membershipWith(null), "member:invite")).toBe(false);
  });
});

describe("isEmailOrganizationMember", () => {
  it("returns false when the organization doesn't exist", async () => {
    mockedFindOrganization.mockResolvedValue(null);

    expect(await isEmailOrganizationMember("bob@example.com", "no-such-org")).toBe(false);
    expect(mockedFindFirstMembership).not.toHaveBeenCalled();
  });

  it("looks up a membership by normalized user email within the organization", async () => {
    mockedFindOrganization.mockResolvedValue({ id: "org-1" } as never);
    mockedFindFirstMembership.mockResolvedValue({ id: "membership-1" } as never);

    expect(await isEmailOrganizationMember(" Bob@Example.com ", "acme")).toBe(true);
    expect(mockedFindFirstMembership).toHaveBeenCalledWith({
      where: { organizationId: "org-1", user: { email: "bob@example.com" } },
    });
  });

  it("returns false when no membership matches", async () => {
    mockedFindOrganization.mockResolvedValue({ id: "org-1" } as never);
    mockedFindFirstMembership.mockResolvedValue(null);

    expect(await isEmailOrganizationMember("bob@example.com", "acme")).toBe(false);
  });
});
