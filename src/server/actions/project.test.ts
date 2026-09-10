import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { verifySession } from "@/server/db/session";
import { requireMembership, requirePermission } from "@/server/db/organization";
import {
  createProject as createProjectRecord,
  updateProject as updateProjectRecord,
  deleteProject as deleteProjectRecord,
} from "@/server/db/project";
import { createProject, deleteProject, updateProject } from "./project";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/server/db/session", () => ({ verifySession: vi.fn() }));
vi.mock("@/server/db/organization", () => ({
  requireMembership: vi.fn(),
  requirePermission: vi.fn(),
}));
vi.mock("@/server/db/project", () => ({
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

const mockedVerifySession = vi.mocked(verifySession);
const mockedRequireMembership = vi.mocked(requireMembership);
const mockedRequirePermission = vi.mocked(requirePermission);
const mockedCreateProjectRecord = vi.mocked(createProjectRecord);
const mockedUpdateProjectRecord = vi.mocked(updateProjectRecord);
const mockedDeleteProjectRecord = vi.mocked(deleteProjectRecord);
const mockedRedirect = vi.mocked(redirect);

const fakeMembership = { id: "membership-1", role: { permissions: [] } };

function p2002() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "6.19.3",
  });
}

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
});

describe("createProject", () => {
  it("checks membership and the project:create permission before anything else", async () => {
    mockedCreateProjectRecord.mockResolvedValue({} as never);

    await createProject("acme", { name: "Website Redesign" });

    expect(mockedRequireMembership).toHaveBeenCalledWith("user-1", "acme");
    expect(mockedRequirePermission).toHaveBeenCalledWith(fakeMembership, "project:create");
  });

  it("rejects a name shorter than 2 characters", async () => {
    const result = await createProject("acme", { name: "A" });

    expect(result).toEqual({ error: "Project name must be at least 2 characters." });
    expect(mockedCreateProjectRecord).not.toHaveBeenCalled();
  });

  it("creates the project and redirects on success", async () => {
    mockedCreateProjectRecord.mockResolvedValue({} as never);

    await createProject("acme", { name: "Website Redesign" });

    expect(mockedCreateProjectRecord).toHaveBeenCalledTimes(1);
    const [organizationSlug, data] = mockedCreateProjectRecord.mock.calls[0];
    expect(organizationSlug).toBe("acme");
    expect(data.name).toBe("Website Redesign");
    expect(data.slug).toMatch(/^website-redesign-[0-9a-f]{6}$/);
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard/acme/projects");
  });

  it("passes status through to the DB layer", async () => {
    mockedCreateProjectRecord.mockResolvedValue({} as never);

    await createProject("acme", {
      name: "Website Redesign",
      status: "IN_PROGRESS",
      priority: "HIGH",
    });

    const [, data] = mockedCreateProjectRecord.mock.calls[0];
    expect(data.status).toBe("IN_PROGRESS");
    expect(data.priority).toBe("HIGH");
  });

  it("retries with a fresh slug on a slug collision (P2002)", async () => {
    mockedCreateProjectRecord.mockRejectedValueOnce(p2002()).mockResolvedValueOnce({} as never);

    await createProject("acme", { name: "Website Redesign" });

    expect(mockedCreateProjectRecord).toHaveBeenCalledTimes(2);
    const [, firstAttemptData] = mockedCreateProjectRecord.mock.calls[0];
    const [, secondAttemptData] = mockedCreateProjectRecord.mock.calls[1];
    expect(firstAttemptData.slug).not.toBe(secondAttemptData.slug);
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard/acme/projects");
  });

  it("gives up after repeated slug collisions instead of retrying forever", async () => {
    mockedCreateProjectRecord.mockRejectedValue(p2002());

    const result = await createProject("acme", { name: "Website Redesign" });

    expect(mockedCreateProjectRecord).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ error: "Something went wrong. Please try again." });
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("does not retry on a non-collision error", async () => {
    mockedCreateProjectRecord.mockRejectedValue(new Error("connection reset"));

    const result = await createProject("acme", { name: "Website Redesign" });

    expect(mockedCreateProjectRecord).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ error: "Something went wrong. Please try again." });
  });

  it("propagates when the user isn't a member instead of swallowing it", async () => {
    mockedRequireMembership.mockRejectedValue(
      new Error("You are not a member of this organization."),
    );

    await expect(createProject("acme", { name: "Website Redesign" })).rejects.toThrow(
      "You are not a member of this organization.",
    );
    expect(mockedCreateProjectRecord).not.toHaveBeenCalled();
  });
});

describe("updateProject", () => {
  it("checks membership and the project:update permission before anything else", async () => {
    mockedUpdateProjectRecord.mockResolvedValue({} as never);

    await updateProject("acme", "website-redesign-abc123", { status: "COMPLETED" });

    expect(mockedRequireMembership).toHaveBeenCalledWith("user-1", "acme");
    expect(mockedRequirePermission).toHaveBeenCalledWith(fakeMembership, "project:update");
  });

  it("only passes through fields present in the payload (patch semantics)", async () => {
    mockedUpdateProjectRecord.mockResolvedValue({} as never);

    await updateProject("acme", "website-redesign-abc123", { status: "COMPLETED" });

    const [, , data] = mockedUpdateProjectRecord.mock.calls[0];
    expect(data.status).toBe("COMPLETED");
    expect(data.name).toBeUndefined();
    expect(data.summary).toBeUndefined();
  });

  it("rejects a name shorter than 2 characters when name is being changed", async () => {
    const result = await updateProject("acme", "website-redesign-abc123", { name: "A" });

    expect(result).toEqual({ error: "Project name must be at least 2 characters." });
    expect(mockedUpdateProjectRecord).not.toHaveBeenCalled();
  });

  it("does not validate name when it's absent from the payload", async () => {
    mockedUpdateProjectRecord.mockResolvedValue({} as never);

    const result = await updateProject("acme", "website-redesign-abc123", {
      status: "COMPLETED",
    });

    expect(result).toBeUndefined();
    expect(mockedUpdateProjectRecord).toHaveBeenCalled();
  });

  it("converts a targetDate string to a Date", async () => {
    mockedUpdateProjectRecord.mockResolvedValue({} as never);

    await updateProject("acme", "website-redesign-abc123", {
      targetDate: "2026-12-01",
    });

    const [, , data] = mockedUpdateProjectRecord.mock.calls[0];
    expect(data.targetDate).toBeInstanceOf(Date);
  });

  it("clears targetDate when explicitly set to null", async () => {
    mockedUpdateProjectRecord.mockResolvedValue({} as never);

    await updateProject("acme", "website-redesign-abc123", { targetDate: null });

    const [, , data] = mockedUpdateProjectRecord.mock.calls[0];
    expect(data.targetDate).toBeNull();
  });

  it("leaves targetDate untouched when absent from the payload", async () => {
    mockedUpdateProjectRecord.mockResolvedValue({} as never);

    await updateProject("acme", "website-redesign-abc123", { status: "COMPLETED" });

    const [, , data] = mockedUpdateProjectRecord.mock.calls[0];
    expect(data.targetDate).toBeUndefined();
  });

  it("returns a friendly error when the project no longer exists", async () => {
    mockedUpdateProjectRecord.mockRejectedValue(p2025());

    const result = await updateProject("acme", "website-redesign-abc123", {
      status: "COMPLETED",
    });

    expect(result).toEqual({ error: "This project no longer exists." });
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("redirects on success", async () => {
    mockedUpdateProjectRecord.mockResolvedValue({} as never);

    await updateProject("acme", "website-redesign-abc123", { status: "COMPLETED" });

    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard/acme/projects");
  });
});

describe("deleteProject", () => {
  it("checks membership and the project:delete permission before anything else", async () => {
    mockedDeleteProjectRecord.mockResolvedValue({} as never);

    await deleteProject("acme", "website-redesign-abc123");

    expect(mockedRequireMembership).toHaveBeenCalledWith("user-1", "acme");
    expect(mockedRequirePermission).toHaveBeenCalledWith(fakeMembership, "project:delete");
  });

  it("redirects on success", async () => {
    mockedDeleteProjectRecord.mockResolvedValue({} as never);

    await deleteProject("acme", "website-redesign-abc123");

    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard/acme/projects");
  });

  it("returns a friendly error when the project no longer exists", async () => {
    mockedDeleteProjectRecord.mockRejectedValue(p2025());

    const result = await deleteProject("acme", "website-redesign-abc123");

    expect(result).toEqual({ error: "This project no longer exists." });
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("returns a generic error for unexpected failures", async () => {
    mockedDeleteProjectRecord.mockRejectedValue(new Error("connection reset"));

    const result = await deleteProject("acme", "website-redesign-abc123");

    expect(result).toEqual({ error: "Something went wrong. Please try again." });
  });
});
