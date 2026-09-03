import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db";
import { requireMembership, requirePermission } from "./organization";

vi.mock("@/server/db", () => ({
  prisma: {
    organization: { findUnique: vi.fn() },
    membership: { findUnique: vi.fn() },
  },
}));

const mockedFindOrganization = vi.mocked(prisma.organization.findUnique);
const mockedFindMembership = vi.mocked(prisma.membership.findUnique);

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
