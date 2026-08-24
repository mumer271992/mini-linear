import { redirect } from "next/navigation";
import { verifySession } from "@/server/db/session";
import { requireOrganization } from "@/server/db/organization";
import { selectDefaultOrganization } from "@/lib/organization";

// This route is only an entry point: it resolves which organization the
// user should land on (last active, falling back to the oldest membership)
// and redirects to that organization's own dashboard. It never renders UI
// of its own.
export default async function DashboardPage() {
  const session = await verifySession();
  const organizations = await requireOrganization(session.userId);

  const organization = selectDefaultOrganization(
    organizations,
    session.lastOrganizationId,
  );

  if (!organization) {
    redirect("/onboarding");
  }

  redirect(`/dashboard/${organization.slug}`);
}
