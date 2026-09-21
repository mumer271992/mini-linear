import "server-only";
import { prisma } from "@/server/db";
import { findProjectBySlug } from "@/server/db/project";
import type { TaskStatus } from "@/generated/prisma/client";

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

export async function getTasksForProject(organizationSlug: string, projectSlug: string) {
  const projectId = await requireProjectId(organizationSlug, projectSlug);

  return prisma.task.findMany({
    where: { projectId },
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
