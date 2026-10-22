import { SignupForm } from "@/components/signup-form";
import { firstSearchParam, getSafeRedirectPath } from "@/lib/redirect";

// Reads ?next= and ?email= here, as a Server Component, rather than with
// useSearchParams in the form -- that hook needs a Suspense boundary or the
// production build fails for this prerendered route.
export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { next, email } = await searchParams;

  return (
    <SignupForm
      next={getSafeRedirectPath(firstSearchParam(next))}
      defaultEmail={firstSearchParam(email)}
    />
  );
}
