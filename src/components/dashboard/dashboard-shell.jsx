import RecentActivity from "../shared/recent-activity";
import RevenueChart from "../shared/revenue-chart";

export default function DashboardShell() {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <RevenueChart />
        <RecentActivity />
      </div>
    </>
  );
}
