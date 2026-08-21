import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex flex-1 flex-col bg-white dark:bg-zinc-900">
        {children}
      </main>
    </div>
  );
}
