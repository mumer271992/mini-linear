import { verifySession } from "@/server/db/session";

export default async function ProjectsPage() {
  await verifySession();

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
    </div>
  );
}
