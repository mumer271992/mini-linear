import { verifySession } from "@/server/db/session";
import { CreateOrganizationForm } from "@/components/create-organization-form";

export default async function OnboardingPage() {
  await verifySession();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <CreateOrganizationForm />
    </div>
  );
}
