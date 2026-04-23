import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { WorkerStatusCard } from "@/components/layout/worker-status-card";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userName = session?.user?.name ?? "Admin";
  const userEmail = session?.user?.email ?? "";

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <AppSidebar
        userName={userName}
        userEmail={userEmail}
        workerStatusCard={<WorkerStatusCard />}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar userName={userName} userEmail={userEmail} />
        <main className="flex-1 overflow-auto bg-[#fafbfc]">
          {children}
        </main>
      </div>
    </div>
  );
}
