import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db";
import { findProjectBySlug } from "@/server/db/project";
import { findOrganizationBySlug } from "@/server/db/organization";
import { getTaskStatusCounts, getTasksAssignedToUser, getTasksForProject } from "./task";

vi.mock("@/server/db", () => ({
  prisma: {
    task: { findMany: vi.fn(), groupBy: vi.fn() },
  },
}));
vi.mock("@/server/db/project", () => ({ findProjectBySlug: vi.fn() }));
vi.mock("@/server/db/organization", () => ({ findOrganizationBySlug: vi.fn() }));

const mockedFindMany = vi.mocked(prisma.task.findMany);
const mockedGroupBy = vi.mocked(prisma.task.groupBy);
const mockedFindProjectBySlug = vi.mocked(findProjectBySlug);
const mockedFindOrganizationBySlug = vi.mocked(findOrganizationBySlug);

function lastFindManyArgs() {
  return mockedFindMany.mock.calls[0][0]!;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedFindProjectBySlug.mockResolvedValue({ id: "project-1" } as never);
  mockedFindMany.mockResolvedValue([]);
  mockedFindOrganizationBySlug.mockResolvedValue({ id: "org-1" } as never);
  mockedGroupBy.mockResolvedValue([]);
});

describe("getTasksForProject", () => {
  it("filters by projectId alone when no filters are given", async () => {
    await getTasksForProject("acme", "website-redesign");

    const { where } = lastFindManyArgs();
    expect(where).toEqual({ projectId: "project-1" });
  });

  it("filters by projectId alone when filter arrays are empty", async () => {
    await getTasksForProject("acme", "website-redesign", { statuses: [], assigneeIds: [] });

    const { where } = lastFindManyArgs();
    expect(where).toEqual({ projectId: "project-1" });
  });

  it("adds a status `in` filter when statuses are given", async () => {
    await getTasksForProject("acme", "website-redesign", {
      statuses: ["BACKLOG", "TODO"],
    });

    const { where } = lastFindManyArgs();
    expect(where).toEqual({
      projectId: "project-1",
      status: { in: ["BACKLOG", "TODO"] },
    });
  });

  it("adds an assignedToId `in` filter when only real member ids are given", async () => {
    await getTasksForProject("acme", "website-redesign", {
      assigneeIds: ["user-1", "user-2"],
    });

    const { where } = lastFindManyArgs();
    expect(where).toEqual({
      projectId: "project-1",
      assignedToId: { in: ["user-1", "user-2"] },
    });
  });

  it("filters to assignedToId: null when only 'unassigned' is given", async () => {
    await getTasksForProject("acme", "website-redesign", {
      assigneeIds: ["unassigned"],
    });

    const { where } = lastFindManyArgs();
    expect(where).toEqual({
      projectId: "project-1",
      assignedToId: null,
    });
  });

  it("combines unassigned and specific members via OR", async () => {
    await getTasksForProject("acme", "website-redesign", {
      assigneeIds: ["unassigned", "user-1"],
    });

    const { where } = lastFindManyArgs();
    expect(where).toEqual({
      projectId: "project-1",
      OR: [{ assignedToId: null }, { assignedToId: { in: ["user-1"] } }],
    });
  });

  it("combines status and assignee filters together", async () => {
    await getTasksForProject("acme", "website-redesign", {
      statuses: ["DONE"],
      assigneeIds: ["user-1"],
    });

    const { where } = lastFindManyArgs();
    expect(where).toEqual({
      projectId: "project-1",
      status: { in: ["DONE"] },
      assignedToId: { in: ["user-1"] },
    });
  });

  it("still includes assignedTo and orders by createdAt desc", async () => {
    await getTasksForProject("acme", "website-redesign");

    const args = lastFindManyArgs();
    expect(args.include).toEqual({ assignedTo: { select: { id: true, name: true } } });
    expect(args.orderBy).toEqual({ createdAt: "desc" });
  });
});

describe("getTaskStatusCounts", () => {
  it("throws when the organization doesn't exist", async () => {
    mockedFindOrganizationBySlug.mockResolvedValue(null);

    await expect(getTaskStatusCounts("no-such-org")).rejects.toThrow(
      "Organization not found.",
    );
    expect(mockedGroupBy).not.toHaveBeenCalled();
  });

  it("scopes the query to the organization's projects and the three stat statuses", async () => {
    await getTaskStatusCounts("acme");

    const [args] = mockedGroupBy.mock.calls[0];
    expect(args.where).toEqual({
      status: { in: ["TODO", "IN_PROGRESS", "DONE"] },
      project: { organizationId: "org-1" },
    });
  });

  it("defaults every status to 0 when there are no tasks at all", async () => {
    mockedGroupBy.mockResolvedValue([]);

    await expect(getTaskStatusCounts("acme")).resolves.toEqual({
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    });
  });

  it("fills in counts only for statuses present in the result, zero for the rest", async () => {
    mockedGroupBy.mockResolvedValue([
      { status: "TODO", _count: 3 },
      { status: "DONE", _count: 7 },
    ] as never);

    await expect(getTaskStatusCounts("acme")).resolves.toEqual({
      TODO: 3,
      IN_PROGRESS: 0,
      DONE: 7,
    });
  });

  it("does not scope by assignedToId when no userId is given", async () => {
    await getTaskStatusCounts("acme");

    const [args] = mockedGroupBy.mock.calls[0];
    expect(args.where).not.toHaveProperty("assignedToId");
  });

  it("scopes by assignedToId when a userId is given", async () => {
    await getTaskStatusCounts("acme", "user-1");

    const [args] = mockedGroupBy.mock.calls[0];
    expect(args.where).toEqual({
      status: { in: ["TODO", "IN_PROGRESS", "DONE"] },
      project: { organizationId: "org-1" },
      assignedToId: "user-1",
    });
  });
});

describe("getTasksAssignedToUser", () => {
  it("throws when the organization doesn't exist", async () => {
    mockedFindOrganizationBySlug.mockResolvedValue(null);

    await expect(getTasksAssignedToUser("no-such-org", "user-1")).rejects.toThrow(
      "Organization not found.",
    );
    expect(mockedFindMany).not.toHaveBeenCalled();
  });

  it("scopes the query to the given user across the organization's projects", async () => {
    await getTasksAssignedToUser("acme", "user-1");

    const { where } = lastFindManyArgs();
    expect(where).toEqual({
      assignedToId: "user-1",
      project: { organizationId: "org-1" },
    });
  });

  it("includes the project and orders by createdAt desc", async () => {
    await getTasksAssignedToUser("acme", "user-1");

    const args = lastFindManyArgs();
    expect(args.include).toEqual({ project: { select: { id: true, name: true, slug: true } } });
    expect(args.orderBy).toEqual({ createdAt: "desc" });
  });

  it("does not add a status filter when none is given", async () => {
    await getTasksAssignedToUser("acme", "user-1", {});

    const { where } = lastFindManyArgs();
    expect(where).toEqual({
      assignedToId: "user-1",
      project: { organizationId: "org-1" },
    });
  });

  it("adds a status filter when one is given", async () => {
    await getTasksAssignedToUser("acme", "user-1", { status: "DONE" });

    const { where } = lastFindManyArgs();
    expect(where).toEqual({
      assignedToId: "user-1",
      project: { organizationId: "org-1" },
      status: "DONE",
    });
  });
});
