import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { WorkerStatusCard } from "@/components/layout/worker-status-card";
import { CommandPalette } from "@/components/command-palette";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userName    = session?.user?.name        ?? "Admin";
  const userEmail   = session?.user?.email       ?? "";
  const permissions = session?.user?.permissions ?? [];
  const roles       = session?.user?.roles       ?? [];


  const roleLabels: Record<string, string> = {
    ADMIN:   "Administrateur",
    MANAGER: "Manager",
    VIEWER:  "Lecteur",
  };
  const userRole = roles.length > 0
    ? roles.map((r) => roleLabels[r] ?? r).join(", ")
    : undefined;

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <AppSidebar
        userName={userName}
        userEmail={userEmail}
        permissions={permissions}
        workerStatusCard={<WorkerStatusCard />}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar userName={userName} userEmail={userEmail} userRole={userRole} />
        <main className="flex-1 overflow-auto bg-[#fafbfc]">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
