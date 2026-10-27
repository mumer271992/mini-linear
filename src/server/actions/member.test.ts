import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { verifySession } from "@/server/db/session";
import {
  deleteMembership,
  findMembershipInOrganization,
  requireMembership,
  requirePermission,
} from "@/server/db/organization";
import { revokeMembership } from "./member";

vi.mock("@/server/db/session", () => ({ verifySession: vi.fn() }));
vi.mock("@/server/db/organization", () => ({
  deleteMembership: vi.fn(),
  findMembershipInOrganization: vi.fn(),
  requireMembership: vi.fn(),
  requirePermission: vi.fn(),
}));

const mockedVerifySession = vi.mocked(verifySession);
const mockedRequireMembership = vi.mocked(requireMembership);
const mockedRequirePermission = vi.mocked(requirePermission);
const mockedDeleteMembership = vi.mocked(deleteMembership);
const mockedFindMembershipInOrganization = vi.mocked(findMembershipInOrganization);

const fakeMembership = { id: "membership-1", organizationId: "org-1", role: { permissions: [] } };
const fakeTarget = { id: "membership-2", role: { name: "Member" } };

function p2025() {
  return new Prisma.PrismaClientKnownRequestError("Record not found", {
    code: "P2025",
    clientVersion: "6.19.3",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedVerifySession.mockResolvedValue({
    sessionId: "session-1",
    userId: "user-1",
    lastOrganizationId: null,
  });
  mockedRequireMembership.mockResolvedValue(fakeMembership as never);
  mockedFindMembershipInOrganization.mockResolvedValue(fakeTarget as never);
});

describe("revokeMembership", () => {
  it("checks membership and the member:remove permission", async () => {
    mockedDeleteMembership.mockResolvedValue({} as never);

    await revokeMembership("acme", "membership-2");

    expect(mockedRequireMembership).toHaveBeenCalledWith("user-1", "acme");
    expect(mockedRequirePermission).toHaveBeenCalledWith(fakeMembership, "member:remove");
  });

  it("does not delete anything when the permission check throws", async () => {
    mockedRequirePermission.mockImplementationOnce(() => {
      throw new Error("You do not have permission to perform this action.");
    });

    await expect(revokeMembership("acme", "membership-2")).rejects.toThrow(
      "You do not have permission to perform this action.",
    );
    expect(mockedDeleteMembership).not.toHaveBeenCalled();
  });

  it("refuses to remove the caller's own membership", async () => {
    await expect(revokeMembership("acme", "membership-1")).resolves.toEqual({
      error: "You can't remove yourself from the organization.",
    });
    expect(mockedDeleteMembership).not.toHaveBeenCalled();
  });

  it("looks the target up within the caller's organization", async () => {
    mockedDeleteMembership.mockResolvedValue({} as never);

    await revokeMembership("acme", "membership-2");

    expect(mockedFindMembershipInOrganization).toHaveBeenCalledWith("org-1", "membership-2");
  });

  it("refuses to remove an Owner", async () => {
    mockedFindMembershipInOrganization.mockResolvedValue({
      id: "membership-2",
      role: { name: "Owner" },
    } as never);

    await expect(revokeMembership("acme", "membership-2")).resolves.toEqual({
      error: "Owners can't be removed from the organization.",
    });
    expect(mockedDeleteMembership).not.toHaveBeenCalled();
  });

  it("returns a friendly error when the target isn't in the organization", async () => {
    mockedFindMembershipInOrganization.mockResolvedValue(null);

    await expect(revokeMembership("acme", "membership-2")).resolves.toEqual({
      error: "This member has already been removed.",
    });
    expect(mockedDeleteMembership).not.toHaveBeenCalled();
  });

  it("deletes the membership and returns nothing on success", async () => {
    mockedDeleteMembership.mockResolvedValue({} as never);

    await expect(revokeMembership("acme", "membership-2")).resolves.toBeUndefined();
    expect(mockedDeleteMembership).toHaveBeenCalledWith("org-1", "membership-2");
  });

  it("returns a friendly error when the membership is already gone", async () => {
    mockedDeleteMembership.mockRejectedValue(p2025());

    await expect(revokeMembership("acme", "membership-2")).resolves.toEqual({
      error: "This member has already been removed.",
    });
  });

  it("returns a generic error for unexpected failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockedDeleteMembership.mockRejectedValue(new Error("connection reset"));

    await expect(revokeMembership("acme", "membership-2")).resolves.toEqual({
      error: "Something went wrong. Please try again.",
    });
  });
});
