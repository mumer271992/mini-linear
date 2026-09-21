import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { verifySession } from "@/server/db/session";
import { isOrganizationMember, requireMembership, requirePermission } from "@/server/db/organization";
import {
  createTask as createTaskRecord,
  updateTask as updateTaskRecord,
  deleteTask as deleteTaskRecord,
} from "@/server/db/task";
import { createTask, deleteTask, updateTask } from "./task";

vi.mock("@/server/db/session", () => ({ verifySession: vi.fn() }));
vi.mock("@/server/db/organization", () => ({
  isOrganizationMember: vi.fn(),
  requireMembership: vi.fn(),
  requirePermission: vi.fn(),
}));
vi.mock("@/server/db/task", () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

const mockedVerifySession = vi.mocked(verifySession);
const mockedIsOrganizationMember = vi.mocked(isOrganizationMember);
const mockedRequireMembership = vi.mocked(requireMembership);
const mockedRequirePermission = vi.mocked(requirePermission);
const mockedCreateTaskRecord = vi.mocked(createTaskRecord);
const mockedUpdateTaskRecord = vi.mocked(updateTaskRecord);
const mockedDeleteTaskRecord = vi.mocked(deleteTaskRecord);

const fakeMembership = { id: "membership-1", role: { permissions: [] } };

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
  mockedIsOrganizationMember.mockResolvedValue(true);
});

describe("createTask", () => {
  it("checks membership and the task:create permission before anything else", async () => {
    mockedCreateTaskRecord.mockResolvedValue({} as never);

    await createTask("acme", "website-redesign-abc123", { title: "Write copy" });

    expect(mockedRequireMembership).toHaveBeenCalledWith("user-1", "acme");
    expect(mockedRequirePermission).toHaveBeenCalledWith(fakeMembership, "task:create");
  });

  it("rejects a title shorter than 2 characters", async () => {
    const result = await createTask("acme", "website-redesign-abc123", { title: "A" });

    expect(result).toEqual({ error: "Task title must be at least 2 characters." });
    expect(mockedCreateTaskRecord).not.toHaveBeenCalled();
  });

  it("creates the task and returns it, without redirecting", async () => {
    const fakeTask = { id: "task-1", title: "Write copy" };
    mockedCreateTaskRecord.mockResolvedValue(fakeTask as never);

    const result = await createTask("acme", "website-redesign-abc123", {
      title: "Write copy",
    });

    expect(mockedCreateTaskRecord).toHaveBeenCalledWith("acme", "website-redesign-abc123", {
      title: "Write copy",
      description: undefined,
      status: undefined,
      assignedToId: undefined,
    });
    expect(result).toEqual({ task: fakeTask });
  });

  it("rejects an assignedToId that isn't a member of the organization", async () => {
    mockedIsOrganizationMember.mockResolvedValue(false);

    const result = await createTask("acme", "website-redesign-abc123", {
      title: "Write copy",
      assignedToId: "user-outsider",
    });

    expect(mockedIsOrganizationMember).toHaveBeenCalledWith("user-outsider", "acme");
    expect(result).toEqual({
      error: "Selected assignee is not a member of this organization.",
    });
    expect(mockedCreateTaskRecord).not.toHaveBeenCalled();
  });

  it("skips the membership check when assignedToId is absent", async () => {
    mockedCreateTaskRecord.mockResolvedValue({} as never);

    await createTask("acme", "website-redesign-abc123", { title: "Write copy" });

    expect(mockedIsOrganizationMember).not.toHaveBeenCalled();
  });

  it("propagates when the user isn't a member instead of swallowing it", async () => {
    mockedRequireMembership.mockRejectedValue(
      new Error("You are not a member of this organization."),
    );

    await expect(
      createTask("acme", "website-redesign-abc123", { title: "Write copy" }),
    ).rejects.toThrow("You are not a member of this organization.");
    expect(mockedCreateTaskRecord).not.toHaveBeenCalled();
  });

  it("returns a generic error for unexpected failures", async () => {
    mockedCreateTaskRecord.mockRejectedValue(new Error("connection reset"));

    const result = await createTask("acme", "website-redesign-abc123", { title: "Write copy" });

    expect(result).toEqual({ error: "Something went wrong. Please try again." });
  });
});

describe("updateTask", () => {
  it("checks membership and the task:update permission before anything else", async () => {
    mockedUpdateTaskRecord.mockResolvedValue({} as never);

    await updateTask("acme", "website-redesign-abc123", "task-1", { status: "DONE" });

    expect(mockedRequireMembership).toHaveBeenCalledWith("user-1", "acme");
    expect(mockedRequirePermission).toHaveBeenCalledWith(fakeMembership, "task:update");
  });

  it("only forwards the fields present in the payload (patch semantics)", async () => {
    mockedUpdateTaskRecord.mockResolvedValue({} as never);

    await updateTask("acme", "website-redesign-abc123", "task-1", { status: "DONE" });

    expect(mockedUpdateTaskRecord).toHaveBeenCalledWith("acme", "website-redesign-abc123", "task-1", {
      status: "DONE",
    });
  });

  it("rejects a title shorter than 2 characters when title is being changed", async () => {
    const result = await updateTask("acme", "website-redesign-abc123", "task-1", { title: "A" });

    expect(result).toEqual({ error: "Task title must be at least 2 characters." });
    expect(mockedUpdateTaskRecord).not.toHaveBeenCalled();
  });

  it("does not validate title when it's absent from the payload", async () => {
    mockedUpdateTaskRecord.mockResolvedValue({} as never);

    const result = await updateTask("acme", "website-redesign-abc123", "task-1", {
      status: "DONE",
    });

    expect(result).toEqual({ task: {} });
    expect(mockedUpdateTaskRecord).toHaveBeenCalled();
  });

  it("rejects an assignedToId that isn't a member of the organization", async () => {
    mockedIsOrganizationMember.mockResolvedValue(false);

    const result = await updateTask("acme", "website-redesign-abc123", "task-1", {
      assignedToId: "user-outsider",
    });

    expect(mockedIsOrganizationMember).toHaveBeenCalledWith("user-outsider", "acme");
    expect(result).toEqual({
      error: "Selected assignee is not a member of this organization.",
    });
    expect(mockedUpdateTaskRecord).not.toHaveBeenCalled();
  });

  it("allows clearing assignedToId to null without a membership check", async () => {
    mockedUpdateTaskRecord.mockResolvedValue({} as never);

    await updateTask("acme", "website-redesign-abc123", "task-1", { assignedToId: null });

    expect(mockedIsOrganizationMember).not.toHaveBeenCalled();
    const [, , , data] = mockedUpdateTaskRecord.mock.calls[0];
    expect(data.assignedToId).toBeNull();
  });

  it("skips the membership check when assignedToId is absent from the payload", async () => {
    mockedUpdateTaskRecord.mockResolvedValue({} as never);

    await updateTask("acme", "website-redesign-abc123", "task-1", { status: "DONE" });

    expect(mockedIsOrganizationMember).not.toHaveBeenCalled();
  });

  it("returns a friendly error when the task no longer exists", async () => {
    mockedUpdateTaskRecord.mockRejectedValue(p2025());

    const result = await updateTask("acme", "website-redesign-abc123", "task-1", {
      status: "DONE",
    });

    expect(result).toEqual({ error: "This task no longer exists." });
  });

  it("returns the updated task on success, without redirecting", async () => {
    const fakeTask = { id: "task-1", status: "DONE" };
    mockedUpdateTaskRecord.mockResolvedValue(fakeTask as never);

    const result = await updateTask("acme", "website-redesign-abc123", "task-1", {
      status: "DONE",
    });

    expect(result).toEqual({ task: fakeTask });
  });
});

describe("deleteTask", () => {
  it("checks membership and the task:delete permission before anything else", async () => {
    mockedDeleteTaskRecord.mockResolvedValue({} as never);

    await deleteTask("acme", "website-redesign-abc123", "task-1");

    expect(mockedRequireMembership).toHaveBeenCalledWith("user-1", "acme");
    expect(mockedRequirePermission).toHaveBeenCalledWith(fakeMembership, "task:delete");
  });

  it("returns undefined on success, without redirecting", async () => {
    mockedDeleteTaskRecord.mockResolvedValue({} as never);

    const result = await deleteTask("acme", "website-redesign-abc123", "task-1");

    expect(result).toBeUndefined();
    expect(mockedDeleteTaskRecord).toHaveBeenCalledWith("acme", "website-redesign-abc123", "task-1");
  });

  it("returns a friendly error when the task no longer exists", async () => {
    mockedDeleteTaskRecord.mockRejectedValue(p2025());

    const result = await deleteTask("acme", "website-redesign-abc123", "task-1");

    expect(result).toEqual({ error: "This task no longer exists." });
  });

  it("returns a generic error for unexpected failures", async () => {
    mockedDeleteTaskRecord.mockRejectedValue(new Error("connection reset"));

    const result = await deleteTask("acme", "website-redesign-abc123", "task-1");

    expect(result).toEqual({ error: "Something went wrong. Please try again." });
  });
});
