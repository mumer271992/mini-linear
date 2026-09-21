import "server-only";
import { prisma } from "@/server/db";
import { findProjectBySlug } from "@/server/db/project";
import { UNASSIGNED_FILTER_VALUE } from "@/lib/task";
import type { Prisma, TaskStatus } from "@/generated/prisma/client";

async function requireProjectId(organizationSlug: string, projectSlug: string) {
  const project = await findProjectBySlug(organizationSlug, projectSlug);
  if (!project) {
    throw new Error("Project not found.");
  }
  return project.id;
}

interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  assignedToId?: string;
}

export async function createTask(
  organizationSlug: string,
  projectSlug: string,
  data: CreateTaskData,
) {
  const projectId = await requireProjectId(organizationSlug, projectSlug);

  return prisma.task.create({
    data: {
      ...data,
      projectId,
    },
  });
}

export interface TaskListFilters {
  statuses?: TaskStatus[];
  // May include UNASSIGNED_FILTER_VALUE alongside real user ids.
  assigneeIds?: string[];
}

export async function getTasksForProject(
  organizationSlug: string,
  projectSlug: string,
  filters?: TaskListFilters,
) {
  const projectId = await requireProjectId(organizationSlug, projectSlug);

  const where: Prisma.TaskWhereInput = { projectId };

  if (filters?.statuses && filters.statuses.length > 0) {
    where.status = { in: filters.statuses };
  }

  if (filters?.assigneeIds && filters.assigneeIds.length > 0) {
    const wantsUnassigned = filters.assigneeIds.includes(UNASSIGNED_FILTER_VALUE);
    const memberIds = filters.assigneeIds.filter((id) => id !== UNASSIGNED_FILTER_VALUE);

    if (wantsUnassigned && memberIds.length > 0) {
      where.OR = [{ assignedToId: null }, { assignedToId: { in: memberIds } }];
    } else if (wantsUnassigned) {
      where.assignedToId = null;
    } else {
      where.assignedToId = { in: memberIds };
    }
  }

  return prisma.task.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// projectId alongside the unique id, same as update/delete below -- a task
// id from a different project should look like it doesn't exist, not leak
// through because the id itself was valid.
export async function findTaskById(
  organizationSlug: string,
  projectSlug: string,
  taskId: string,
) {
  const projectId = await requireProjectId(organizationSlug, projectSlug);

  return prisma.task.findUnique({
    where: { id: taskId, projectId },
  });
}

interface UpdateTaskData {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  assignedToId?: string | null;
}

export async function updateTask(
  organizationSlug: string,
  projectSlug: string,
  taskId: string,
  data: UpdateTaskData,
) {
  const projectId = await requireProjectId(organizationSlug, projectSlug);

  // projectId alongside the unique id -- a valid task id from a different
  // project simply won't match, so this doubles as the tenant-scoping check
  // rather than trusting the caller's projectSlug blindly.
  return prisma.task.update({
    where: { id: taskId, projectId },
    data,
  });
}

export async function deleteTask(
  organizationSlug: string,
  projectSlug: string,
  taskId: string,
) {
  const projectId = await requireProjectId(organizationSlug, projectSlug);

  return prisma.task.delete({
    where: { id: taskId, projectId },
  });
}
