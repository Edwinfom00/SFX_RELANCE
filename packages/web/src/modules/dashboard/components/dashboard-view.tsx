import { getDashboardStats } from "../models";
import { DashboardStats } from "./dashboard-stats";
import { RecentActivity } from "./recent-activity";
import { DashboardCharts } from "./dashboard-charts";

export async function DashboardView({ period = 30 }: { period?: number }) {
  const stats = await getDashboardStats(period);

  return (
    <div className="flex flex-col gap-5">
      <DashboardStats stats={stats} period={period} />
      <DashboardCharts period={period} />
      <RecentActivity />
    </div>
  );
}
