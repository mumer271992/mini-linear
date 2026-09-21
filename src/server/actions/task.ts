"use server";

import { verifySession } from "@/server/db/session";
import { isOrganizationMember, requireMembership, requirePermission } from "@/server/db/organization";
import {
  createTask as createTaskRecord,
  updateTask as updateTaskRecord,
  deleteTask as deleteTaskRecord,
} from "@/server/db/task";
import { isRecordNotFoundError } from "@/lib/prisma";
import type { Task, TaskStatus } from "@/generated/prisma/client";

interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  assignedToId?: string;
}

interface TaskErrorResult {
  error: string;
}

// Unlike project/organization actions, task mutations don't redirect: tasks
// live inside the project detail page's Tasks tab (client-side state, no
// route of its own), so a redirect would just reload that page and reset
// the tab back to Overview. Callers get the mutated task back instead.
export async function createTask(
  organizationSlug: string,
  projectSlug: string,
  formData: CreateTaskRequest,
): Promise<{ task: Task } | TaskErrorResult> {
  const session = await verifySession();
  const membership = await requireMembership(session.userId, organizationSlug);
  requirePermission(membership, "task:create");

  const title = formData.title?.trim();
  if (!title || title.length < 2) {
    return { error: "Task title must be at least 2 characters." };
  }

  if (
    formData.assignedToId &&
    !(await isOrganizationMember(formData.assignedToId, organizationSlug))
  ) {
    return { error: "Selected assignee is not a member of this organization." };
  }

  try {
    const task = await createTaskRecord(organizationSlug, projectSlug, {
      title,
      description: formData.description,
      status: formData.status,
      assignedToId: formData.assignedToId,
    });
    return { task };
  } catch (error) {
    console.error(error);
    return { error: "Something went wrong. Please try again." };
  }
}

interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  assignedToId?: string | null;
}

export async function updateTask(
  organizationSlug: string,
  projectSlug: string,
  taskId: string,
  formData: UpdateTaskRequest,
): Promise<{ task: Task } | TaskErrorResult> {
  const session = await verifySession();
  const membership = await requireMembership(session.userId, organizationSlug);
  requirePermission(membership, "task:update");

  if (formData.title !== undefined) {
    const trimmedTitle = formData.title.trim();
    if (trimmedTitle.length < 2) {
      return { error: "Task title must be at least 2 characters." };
    }
    formData.title = trimmedTitle;
  }

  if (
    formData.assignedToId &&
    !(await isOrganizationMember(formData.assignedToId, organizationSlug))
  ) {
    return { error: "Selected assignee is not a member of this organization." };
  }

  try {
    const task = await updateTaskRecord(organizationSlug, projectSlug, taskId, formData);
    return { task };
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return { error: "This task no longer exists." };
    }

    console.error(error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function deleteTask(
  organizationSlug: string,
  projectSlug: string,
  taskId: string,
): Promise<TaskErrorResult | void> {
  const session = await verifySession();
  const membership = await requireMembership(session.userId, organizationSlug);
  requirePermission(membership, "task:delete");

  try {
    await deleteTaskRecord(organizationSlug, projectSlug, taskId);
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return { error: "This task no longer exists." };
    }

    console.error(error);
    return { error: "Something went wrong. Please try again." };
  }
}
