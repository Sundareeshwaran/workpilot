import PageHeader from "@/components/dashboard/page-header";
import MetricCard from "@/components/dashboard/metric-card";
import { stats } from "@/constants/dummy";
import RevenueChart from "@/components/shared/revenue-chart";
import RecentActivity from "@/components/shared/recent-activity";
import DashboardShell from "@/components/dashboard/dashboard-shell";

export default function DashboardPage() {
  const numFormatter = new Intl.NumberFormat("en-IN");
  return (
    <div>
      <PageHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <MetricCard
          title="Total Clients"
          value={numFormatter.format(stats.clients)}
          icon="Clients"
          description="All your clients"
        />
        <MetricCard
          title="Total Projects"
          value={numFormatter.format(stats.projects)}
          icon="Projects"
          description="All your projects"
        />
        <MetricCard
          title="Total Invoices"
          value={stats.invoices}
          icon="Invoices"
          description="All your invoices"
        />
        <MetricCard
          title="Total Revenue"
          value={numFormatter.format(stats.revenue)}
          icon="Revenue"
          description="All your revenue"
        />
      </div>
      <DashboardShell />
    </div>
  );
}
