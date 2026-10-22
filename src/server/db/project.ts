import "server-only";
import { cache } from "react";
import { prisma } from "@/server/db";
import { findOrganizationBySlug } from "@/server/db/organization";
import type { ProjectPriority, ProjectStatus } from "@/generated/prisma/client";

async function requireOrganizationId(organizationSlug: string) {
  const organization = await findOrganizationBySlug(organizationSlug);
  if (!organization) {
    throw new Error("Organization not found.");
  }
  return organization.id;
}

interface CreateProjectData {
  name: string;
  slug: string;
  summary?: string;
  description?: string;
  targetDate?: Date;
  priority?: ProjectPriority;
  status?: ProjectStatus;
  assignedToId?: string;
}

export async function createProject(
  organizationSlug: string,
  data: CreateProjectData,
) {
  const organizationId = await requireOrganizationId(organizationSlug);

  return prisma.project.create({
    data: {
      ...data,
      organizationId,
    },
  });
}

export async function getProjectsForOrganization(organizationSlug: string) {
  const organizationId = await requireOrganizationId(organizationSlug);

  return prisma.project.findMany({
    where: { organizationId },
    include: {
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// cache()-wrapped so the project-detail layout and its nested pages (which
// each need this independently -- Next.js doesn't let a layout pass fetched
// data down into a page as props) share one query per request instead of
// duplicating it.
export const findProjectBySlug = cache(
  async (organizationSlug: string, projectSlug: string) => {
    const organizationId = await requireOrganizationId(organizationSlug);

    return prisma.project.findUnique({
      where: {
        organizationId_slug: {
          organizationId,
          slug: projectSlug,
        },
      },
    });
  },
);

interface UpdateProjectData {
  name?: string;
  summary?: string | null;
  description?: string | null;
  targetDate?: Date | null;
  priority?: ProjectPriority;
  status?: ProjectStatus;
  assignedToId?: string | null;
}

export async function updateProject(
  organizationSlug: string,
  projectSlug: string,
  data: UpdateProjectData,
) {
  const organizationId = await requireOrganizationId(organizationSlug);

  return prisma.project.update({
    where: {
      organizationId_slug: {
        organizationId,
        slug: projectSlug,
      },
    },
    data,
  });
}

export async function deleteProject(
  organizationSlug: string,
  projectSlug: string,
) {
  const organizationId = await requireOrganizationId(organizationSlug);

  return prisma.project.delete({
    where: {
      organizationId_slug: {
        organizationId,
        slug: projectSlug,
      },
    },
  });
}
