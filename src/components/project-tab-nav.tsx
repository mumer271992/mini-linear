"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ProjectTabNavProps {
  orgSlug: string;
  projectSlug: string;
}

export function ProjectTabNav({ orgSlug, projectSlug }: ProjectTabNavProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/${orgSlug}/projects/${projectSlug}`;

  const tabs = [
    { label: "Overview", href: basePath },
    { label: "Tasks", href: `${basePath}/tasks` },
  ];

  return (
    <div className="mt-6 flex gap-6 border-b border-black/[.08] dark:border-white/[.145]">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              "border-b-2 pb-3 text-sm font-medium",
              isActive
                ? "border-zinc-950 text-zinc-950 dark:border-zinc-50 dark:text-zinc-50"
                : "border-transparent text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
