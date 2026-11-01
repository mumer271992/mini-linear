import { LoginForm, type LoginNotice } from "@/components/login-form";
import { firstSearchParam, getSafeRedirectPath } from "@/lib/redirect";

// Set by the /verify-email/[token] handler. Only these fixed keys are
// shown -- the param's own text never reaches the page.
const NOTICES: Record<string, LoginNotice> = {
  "email-verified": { tone: "success", message: "Email verified. Log in to continue." },
  "verification-link-invalid": {
    tone: "error",
    message: "That verification link is invalid or has expired. Log in to get a new one.",
  },
};

// Reads ?next= and ?email= here, as a Server Component, rather than with
// useSearchParams in the form -- that hook needs a Suspense boundary or the
// production build fails for this prerendered route.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, email, notice } = await searchParams;
  const noticeKey = firstSearchParam(notice);

  return (
    <LoginForm
      next={getSafeRedirectPath(firstSearchParam(next))}
      defaultEmail={firstSearchParam(email)}
      notice={noticeKey && Object.hasOwn(NOTICES, noticeKey) ? NOTICES[noticeKey] : undefined}
    />
  );
}
