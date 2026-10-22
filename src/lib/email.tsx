import "server-only";
import { Resend } from "resend";
import { InviteEmail } from "@/emails/invite-email";

// Narrows to `string` at the type level (not just a runtime check) -- a
// plain `if (!x) throw` on a module-scope `const` doesn't carry through into
// functions declared later in the file, since TS can't narrow across a
// closure boundary, so sendInviteEmail below would still see `string | undefined`.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
}

const apiKey = requireEnv("RESEND_API_KEY");
// Full "from" header, e.g. "Mini Linear <invites@mail.yourdomain.com>" --
// kept out of source so the actual domain never needs to be hardcoded/committed.
const fromAddress = requireEnv("RESEND_FROM_EMAIL");

const resend = new Resend(apiKey);

interface SendInviteEmailParams {
  to: string;
  organizationName: string;
  inviterName: string;
  acceptUrl: string;
}

// Throws on failure rather than returning a {error} result -- this is an
// infra-level helper, not a Server Action; the action that calls it is
// responsible for catching and translating into the UI-facing result shape,
// same as how Prisma errors are left to throw out of the db/ layer.
export async function sendInviteEmail({
  to,
  organizationName,
  inviterName,
  acceptUrl,
}: SendInviteEmailParams) {
  const { error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject: `${inviterName} invited you to join ${organizationName} on Mini Linear`,
    react: (
      <InviteEmail
        organizationName={organizationName}
        inviterName={inviterName}
        acceptUrl={acceptUrl}
      />
    ),
  });

  if (error) {
    throw new Error(`Failed to send invite email: ${error.message}`);
  }
}
