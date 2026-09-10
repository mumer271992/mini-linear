import { notFound } from "next/navigation";
import { verifySession, setSessionOrganization } from "@/server/db/session";
import { findOrganizationBySlug, requireMembership } from "@/server/db/organization";

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
    <div className="flex flex-1 flex-col items-center justify-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Organization: {organization.name}
      </h1>
    </div>
  );
}
