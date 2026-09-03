"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { verifySession } from "@/server/db/session";
import { requireMembership, requirePermission } from "@/server/db/organization";
import {
  createProject as createProjectRecord,
  updateProject as updateProjectRecord,
  deleteProject as deleteProjectRecord,
} from "@/server/db/project";
import { slugify } from "@/lib/string";
import { isRecordNotFoundError, isUniqueConstraintError } from "@/lib/prisma";
import type { ProjectPriority, ProjectStatus } from "@/generated/prisma/client";

const MAX_SLUG_ATTEMPTS = 3;

function generateProjectSlug(name: string) {
  const randomSuffix = crypto.randomBytes(3).toString("hex");
  return `${slugify(name)}-${randomSuffix}`;
}

interface CreateProjectRequest {
  name: string;
  summary?: string;
  description?: string;
  targetDate?: string;
  priority?: ProjectPriority;
  assignedToId?: string;
}

interface ProjectResult {
  error: string;
}

export async function createProject(
  organizationSlug: string,
  formData: CreateProjectRequest,
): Promise<ProjectResult> {
  const session = await verifySession();
  const membership = await requireMembership(session.userId, organizationSlug);
  requirePermission(membership, "project:create");

  const name = formData.name?.trim();
  if (!name || name.length < 2) {
    return { error: "Project name must be at least 2 characters." };
  }

  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
    try {
      await createProjectRecord(organizationSlug, {
        name,
        slug: generateProjectSlug(name),
        summary: formData.summary,
        description: formData.description,
        targetDate: formData.targetDate ? new Date(formData.targetDate) : undefined,
        priority: formData.priority,
        assignedToId: formData.assignedToId,
      });
      break;
    } catch (error) {
      // The random suffix makes a collision extremely unlikely, but the
      // unique constraint is the real guard -- retry with a fresh slug
      // rather than surfacing an internal implementation detail as an error.
      if (isUniqueConstraintError(error) && attempt < MAX_SLUG_ATTEMPTS) {
        continue;
      }

      console.error(error);
      return { error: "Something went wrong. Please try again." };
    }
  }

  redirect(`/dashboard/${organizationSlug}/projects`);
}

interface UpdateProjectRequest {
  name?: string;
  summary?: string | null;
  description?: string | null;
  targetDate?: string | null;
  priority?: ProjectPriority;
  status?: ProjectStatus;
  assignedToId?: string | null;
}

export async function updateProject(
  organizationSlug: string,
  projectSlug: string,
  formData: UpdateProjectRequest,
): Promise<ProjectResult> {
  const session = await verifySession();
  const membership = await requireMembership(session.userId, organizationSlug);
  requirePermission(membership, "project:update");

  if (formData.name !== undefined) {
    const trimmedName = formData.name.trim();
    if (trimmedName.length < 2) {
      return { error: "Project name must be at least 2 characters." };
    }
    formData.name = trimmedName;
  }

  try {
    await updateProjectRecord(organizationSlug, projectSlug, {
      ...formData,
      targetDate:
        formData.targetDate !== undefined
          ? formData.targetDate
            ? new Date(formData.targetDate)
            : null
          : undefined,
    });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return { error: "This project no longer exists." };
    }

    console.error(error);
    return { error: "Something went wrong. Please try again." };
  }

  redirect(`/dashboard/${organizationSlug}/projects`);
}

export async function deleteProject(
  organizationSlug: string,
  projectSlug: string,
): Promise<ProjectResult | void> {
  const session = await verifySession();
  const membership = await requireMembership(session.userId, organizationSlug);
  requirePermission(membership, "project:delete");

  try {
    await deleteProjectRecord(organizationSlug, projectSlug);
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return { error: "This project no longer exists." };
    }

    console.error(error);
    return { error: "Something went wrong. Please try again." };
  }

  redirect(`/dashboard/${organizationSlug}/projects`);
}
