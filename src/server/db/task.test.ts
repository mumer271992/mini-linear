import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db";
import { findProjectBySlug } from "@/server/db/project";
import { getTasksForProject } from "./task";

vi.mock("@/server/db", () => ({
  prisma: {
    task: { findMany: vi.fn() },
  },
}));
vi.mock("@/server/db/project", () => ({ findProjectBySlug: vi.fn() }));

const mockedFindMany = vi.mocked(prisma.task.findMany);
const mockedFindProjectBySlug = vi.mocked(findProjectBySlug);

function lastFindManyArgs() {
  return mockedFindMany.mock.calls[0][0]!;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedFindProjectBySlug.mockResolvedValue({ id: "project-1" } as never);
  mockedFindMany.mockResolvedValue([]);
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
