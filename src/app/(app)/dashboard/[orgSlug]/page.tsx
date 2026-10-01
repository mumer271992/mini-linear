import { notFound } from "next/navigation";
import { verifySession, setSessionOrganization } from "@/server/db/session";
import { findOrganizationBySlug, requireMembership } from "@/server/db/organization";
import { TaskStatusStats } from "@/components/task-status-stats";
import { MyTasksList } from "@/components/my-tasks-list";

export default async function OrganizationDashboardPage({
  params,
}: PageProps<"/dashboard/[orgSlug]">) {
  const session = await verifySession();
  const { orgSlug } = await params;

  const organization = await findOrganizationBySlug(orgSlug);
  if (!organization) {
    notFound();
  }

  await requireMembership(session.userId, orgSlug);
  await setSessionOrganization(session.sessionId, organization.id);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome to {organization.name}
      </h1>
      <TaskStatusStats orgSlug={orgSlug} />
      <MyTasksList orgSlug={orgSlug} userId={session.userId} />
    </div>
  );
}
