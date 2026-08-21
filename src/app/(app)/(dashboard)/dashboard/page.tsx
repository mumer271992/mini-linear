import { verifySession } from "@/server/db/session";
import { findUserById } from "@/server/db/user";

export default async function DashboardPage() {
  const session = await verifySession();
  const user = await findUserById(session.userId);

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome, {user?.name}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {user?.email}
      </p>
    </div>
  );
}
