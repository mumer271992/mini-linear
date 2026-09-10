import Link from "next/link";
import { verifySession } from "@/server/db/session";
import { requireMembership } from "@/server/db/organization";
import { getProjectsForOrganization } from "@/server/db/project";
import type { ProjectPriority, ProjectStatus } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const PRIORITY_DOT_COLORS: Record<ProjectPriority, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-amber-400",
  LOW: "bg-zinc-400",
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  BACKLOG: "Backlog",
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_DOT_COLORS: Record<ProjectStatus, string> = {
  BACKLOG: "bg-zinc-400",
  PLANNED: "bg-blue-500",
  IN_PROGRESS: "bg-amber-400",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-500",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function ProjectDetailsPage({
  params,
}: PageProps<"/dashboard/[orgSlug]/projects/[projectSlug]">) {
  const session = await verifySession();
  const { orgSlug, projectSlug } = await params;

  await requireMembership(session.userId, orgSlug);

  return (
    <div className="flex flex-1 flex-col p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Project</h1>
      </div>
    </div>
  );
}
