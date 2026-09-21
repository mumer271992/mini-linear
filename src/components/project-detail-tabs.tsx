"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { EditProjectForm } from "@/components/edit-project-form";
import type { findProjectBySlug } from "@/server/db/project";

interface ProjectDetailTabsProps {
  orgSlug: string;
  projectSlug: string;
  project: NonNullable<Awaited<ReturnType<typeof findProjectBySlug>>>;
  members: { id: string; name: string }[];
}

const TABS = ["Overview", "Tasks"] as const;
type Tab = (typeof TABS)[number];

export function ProjectDetailTabs({
  orgSlug,
  projectSlug,
  project,
  members,
}: ProjectDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  return (
    <div className="mt-6">
      <div className="flex gap-6 border-b border-black/[.08] dark:border-white/[.145]">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "cursor-pointer border-b-2 pb-3 text-sm font-medium",
              activeTab === tab
                ? "border-zinc-950 text-zinc-950 dark:border-zinc-50 dark:text-zinc-50"
                : "border-transparent text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6 max-w-sm">
        {activeTab === "Overview" ? (
          <EditProjectForm
            orgSlug={orgSlug}
            projectSlug={projectSlug}
            project={project}
            members={members}
          />
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Tasks coming soon.
          </p>
        )}
      </div>
    </div>
  );
}
