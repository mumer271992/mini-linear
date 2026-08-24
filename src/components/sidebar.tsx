import Link from "next/link";
import { verifySession } from "@/server/db/session";
import { requireOrganization } from "@/server/db/organization";
import { OrganizationSwitcher } from "@/components/organization-switcher";

interface SidebarProps {
  orgSlug: string;
}

export async function Sidebar({ orgSlug }: SidebarProps) {
  const session = await verifySession();
  const organizations = await requireOrganization(session.userId);
  const currentOrganization = organizations.find(
    (organization) => organization.slug === orgSlug,
  );

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-zinc-950 text-zinc-50">
      <div className="p-4">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          Mini Linear
        </Link>
      </div>

      <nav className="flex flex-col gap-1 px-2">
        <Link
          href={`/dashboard/${orgSlug}`}
          className="rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Overview
        </Link>
        <Link
          href={`/dashboard/${orgSlug}/projects`}
          className="rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Projects
        </Link>
      </nav>

      {currentOrganization && (
        <OrganizationSwitcher
          organizations={organizations.map((organization) => ({
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
          }))}
          currentOrganizationId={currentOrganization.id}
        />
      )}
    </aside>
  );
}
