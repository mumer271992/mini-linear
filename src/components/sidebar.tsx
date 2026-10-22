import Link from "next/link";
import { verifySession } from "@/server/db/session";
import { requireOrganization } from "@/server/db/organization";
import { findUserById } from "@/server/db/user";
import { OrganizationSwitcher } from "@/components/organization-switcher";

interface SidebarProps {
  orgSlug: string;
}

export async function Sidebar({ orgSlug }: SidebarProps) {
  const session = await verifySession();
  const [organizations, user] = await Promise.all([
    requireOrganization(session.userId),
    findUserById(session.userId),
  ]);
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
        <Link
          href={`/dashboard/${orgSlug}/members`}
          className="rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Members
        </Link>
      </nav>

      {currentOrganization && user && (
        <OrganizationSwitcher
          organizations={organizations.map((organization) => ({
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
          }))}
          currentOrganizationId={currentOrganization.id}
          // Only the email -- the full user row includes passwordHash, which
          // must never be serialized into a Client Component's props.
          userEmail={user.email}
        />
      )}
    </aside>
  );
}
