import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const userEmail = headerList.get("x-user-email") || undefined;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar (desktop only) */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userEmail={userEmail} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto page-enter">{children}</div>
        </main>
      </div>
    </div>
  );
}
