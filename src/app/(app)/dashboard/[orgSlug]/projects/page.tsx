import Link from "next/link";
import { verifySession } from "@/server/db/session";
import { requireMembership } from "@/server/db/organization";
import { getProjectsForOrganization } from "@/server/db/project";
import { getProjectPriorityOption, getProjectStatusOption } from "@/lib/project";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function ProjectsPage({
  params,
}: PageProps<"/dashboard/[orgSlug]/projects">) {
  const session = await verifySession();
  const { orgSlug } = await params;

  await requireMembership(session.userId, orgSlug);
  const projects = await getProjectsForOrganization(orgSlug);

  return (
    <div className="flex flex-1 flex-col p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <Link
          href={`/dashboard/${orgSlug}/projects/create`}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10 4a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 10 4Z" />
          </svg>
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          No projects yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-black/[.08] dark:border-white/[.145]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/[.08] text-zinc-600 dark:border-white/[.145] dark:text-zinc-400">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Target date</th>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const priority = getProjectPriorityOption(project.priority);
                const status = getProjectStatusOption(project.status);

                return (
                  <tr
                    key={project.id}
                    className="border-b border-black/[.08] last:border-b-0 dark:border-white/[.145]"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-950 dark:text-zinc-50">
                      <Link
                        href={`/dashboard/${orgSlug}/projects/${project.slug}`}
                        className="hover:underline"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={cn("h-2 w-2 rounded-full", priority.dotColor)}
                        />
                        {priority.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {project.targetDate
                        ? dateFormatter.format(project.targetDate)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {project.assignedTo?.name ?? "Unassigned"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={cn("h-2 w-2 rounded-full", status.dotColor)}
                        />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
