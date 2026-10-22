import { notFound } from "next/navigation";
import { verifySession } from "@/server/db/session";
import { requireMembership } from "@/server/db/organization";
import { findUserById } from "@/server/db/user";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { TextField } from "@/components/ui/text-field";

export default async function AccountSettingsPage({
  params,
}: PageProps<"/dashboard/[orgSlug]/settings/account">) {
  const session = await verifySession();
  const { orgSlug } = await params;

  // Account settings aren't org-scoped, but the page lives under the org so
  // the sidebar stays -- still guard the slug so a foreign org's URL 404s/throws
  // like every other page here.
  await requireMembership(session.userId, orgSlug);
  const user = await findUserById(session.userId);
  if (!user) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col p-8">
      <Breadcrumb
        items={[
          { label: "Settings", href: `/dashboard/${orgSlug}/settings/account` },
          { label: "Account" },
        ]}
        className="mb-2"
      />
      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>

      <div className="mt-6 flex max-w-md flex-col gap-1.5">
        {/* Read-only for now -- changing email needs re-verification. Reset
            password goes below this once it exists. */}
        <TextField
          id="email"
          label="Email"
          type="email"
          value={user.email}
          disabled
          readOnly
          aria-describedby="email-help"
          className="disabled:cursor-not-allowed disabled:opacity-60"
        />
        <p id="email-help" className="text-sm text-zinc-600 dark:text-zinc-400">
          Email can&apos;t be changed yet.
        </p>
      </div>
    </div>
  );
}
