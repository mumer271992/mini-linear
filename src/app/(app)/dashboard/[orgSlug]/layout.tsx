import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({
  children,
  modal,
  params,
}: LayoutProps<"/dashboard/[orgSlug]">) {
  const { orgSlug } = await params;

  return (
    <div className="flex flex-1">
      <Sidebar orgSlug={orgSlug} />
      <main className="flex flex-1 flex-col bg-white dark:bg-zinc-900">
        {children}
      </main>
      {modal}
    </div>
  );
}
