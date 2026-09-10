import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db";
import {
  getOrganizationMembers,
  isOrganizationMember,
  requireMembership,
  requirePermission,
} from "./organization";

vi.mock("@/server/db", () => ({
  prisma: {
    organization: { findUnique: vi.fn() },
    membership: { findUnique: vi.fn(), findMany: vi.fn() },
  },
}));

const mockedFindOrganization = vi.mocked(prisma.organization.findUnique);
const mockedFindMembership = vi.mocked(prisma.membership.findUnique);
const mockedFindManyMemberships = vi.mocked(prisma.membership.findMany);

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
