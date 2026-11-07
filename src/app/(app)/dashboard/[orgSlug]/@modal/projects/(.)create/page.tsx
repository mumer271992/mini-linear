import { getOrganizationMembers, requireMembership } from "@/server/db/organization";
import { verifySession } from "@/server/db/session";
import { CreateProjectModal } from "@/components/create-project-modal";

// TEMP: timing logs to debug the slow modal open on production -- remove once
// diagnosed. performance.now() rather than console.time, whose labels collide
// across concurrent requests in the same serverless instance. Lives outside
// the component because react-hooks/purity forbids impure calls in render.
async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    console.log(`[create-project-modal] ${label}: ${(performance.now() - start).toFixed(0)}ms`);
  }
}

export default async function CreateProjectModalPage({
  params,
}: PageProps<"/dashboard/[orgSlug]/projects/create">) {
  return timed("total", async () => {
    const session = await timed("verifySession", () => verifySession());
    const { orgSlug } = await params;

    await timed("requireMembership", () => requireMembership(session.userId, orgSlug));
    const members = await timed("getOrganizationMembers", () => getOrganizationMembers(orgSlug));

    return <CreateProjectModal orgSlug={orgSlug} members={members} />;
  });
}
