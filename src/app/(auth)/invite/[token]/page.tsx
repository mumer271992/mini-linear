import type { Metadata } from "next";
import Link from "next/link";
import { getOptionalSession } from "@/server/db/session";
import { findInviteByToken } from "@/server/db/invite";
import { findUserById } from "@/server/db/user";
import { isOrganizationMember } from "@/server/db/organization";
import { logout } from "@/server/actions/auth";
import { normalizeString } from "@/lib/string";
import { buildAuthHref } from "@/lib/redirect";
import { Button } from "@/components/ui/button";
import { AcceptInviteButton } from "@/components/accept-invite-button";

export const metadata: Metadata = {
  title: "Accept invite · Mini Linear",
  // The URL carries a secret token -- keep it out of search indexes.
  robots: { index: false, follow: false },
};

const PRIMARY_LINK =
  "flex justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]";
const SECONDARY_LINK =
  "flex justify-center rounded-full border border-black/[.08] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]";

// Public page: renders for logged-in and logged-out visitors alike, so it
// uses getOptionalSession rather than verifySession. Every state shown here
// is display only -- acceptInvite re-checks all of it before writing.
export default async function AcceptInvitePage({
  params,
}: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const invite = await findInviteByToken(token);

  if (!invite || invite.status !== "PENDING") {
    return (
      <InviteMessage title="This invite link isn't valid">
        It may have already been used or cancelled. Ask the person who invited
        you to send a new one.
      </InviteMessage>
    );
  }

  const organizationName = invite.organization.name;
  const inviterName = invite.invitedBy.name;

  if (invite.expiresAt <= new Date()) {
    return (
      <InviteMessage title="This invite has expired">
        Ask {inviterName} to send you a new one.
      </InviteMessage>
    );
  }

  const invitePath = `/invite/${token}`;
  const intro = (
    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
      {inviterName} invited <span className="font-medium text-zinc-950 dark:text-zinc-50">{invite.email}</span>{" "}
      to join {organizationName} as a {invite.role.name.toLowerCase()}.
    </p>
  );

  const session = await getOptionalSession();
  const user = session ? await findUserById(session.userId) : null;

  if (!user) {
    return (
      <InviteLayout title={`Join ${organizationName}`} intro={intro}>
        <Link href={buildAuthHref("/signup", { next: invitePath, email: invite.email })} className={PRIMARY_LINK}>
          Sign up
        </Link>
        <Link href={buildAuthHref("/login", { next: invitePath, email: invite.email })} className={SECONDARY_LINK}>
          Log in
        </Link>
      </InviteLayout>
    );
  }

  if (normalizeString(user.email) !== normalizeString(invite.email)) {
    // Log out, then land on login with the invited email pre-filled and a
    // way back here.
    const logoutToInvite = logout.bind(
      null,
      buildAuthHref("/login", { next: invitePath, email: invite.email }),
    );

    return (
      <InviteLayout title={`Join ${organizationName}`} intro={intro}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You&apos;re signed in as{" "}
          <span className="font-medium text-zinc-950 dark:text-zinc-50">{user.email}</span>. Log out
          and sign in with the invited email to accept.
        </p>
        <form action={logoutToInvite}>
          <Button type="submit" className="w-full">
            Log out
          </Button>
        </form>
      </InviteLayout>
    );
  }

  if (await isOrganizationMember(user.id, invite.organization.slug)) {
    return (
      <InviteLayout title={`You're already in ${organizationName}`}>
        <Link href={`/dashboard/${invite.organization.slug}`} className={PRIMARY_LINK}>
          Go to {organizationName}
        </Link>
      </InviteLayout>
    );
  }

  return (
    <InviteLayout title={`Join ${organizationName}`} intro={intro}>
      <AcceptInviteButton token={token} />
    </InviteLayout>
  );
}

function InviteLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {intro}
      <div className="mt-8 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function InviteMessage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{children}</p>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-medium text-zinc-950 hover:underline dark:text-zinc-50"
      >
        Go to homepage
      </Link>
    </div>
  );
}
