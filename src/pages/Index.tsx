import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { MRRMovementChart } from "@/components/dashboard/MRRMovementChart";
import { ClientsTable } from "@/components/dashboard/ClientsTable";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { ChurnChart } from "@/components/dashboard/ChurnChart";
import { LTVCACChart } from "@/components/dashboard/LTVCACChart";
import {
  DollarSign,
  Users,
  TrendingDown,
  Target,
  Wallet,
  Calendar,
} from "lucide-react";

export default function Index() {
  return (
    <AppLayout
      title="Dashboard Executivo"
      subtitle="Visão geral das métricas financeiras e operacionais"
    >
      {/* Top Metrics */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="MRR"
          value="R$ 124.000"
          change={10.7}
          icon={<DollarSign className="h-6 w-6" />}
          variant="primary"
        />
        <MetricCard
          title="ARR"
          value="R$ 1,49M"
          change={10.7}
          icon={<Calendar className="h-6 w-6" />}
          variant="success"
        />
        <MetricCard
          title="Clientes Ativos"
          value="186"
          change={8.2}
          icon={<Users className="h-6 w-6" />}
          variant="primary"
        />
        <MetricCard
          title="Churn Rate"
          value="1.5%"
          change={-18.5}
          icon={<TrendingDown className="h-6 w-6" />}
          variant="success"
        />
        <MetricCard
          title="LTV:CAC"
          value="5.3x"
          change={14.3}
          icon={<Target className="h-6 w-6" />}
          variant="success"
        />
        <MetricCard
          title="Runway"
          value="18 meses"
          change={0}
          icon={<Wallet className="h-6 w-6" />}
          variant="warning"
        />
      </div>

      {/* Main Charts Row */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <RevenueChart />
        <MRRMovementChart />
      </div>

      {/* Secondary Charts Row */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <ChurnChart />
        <LTVCACChart />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ClientsTable />
        </div>
        <QuickStats />
      </div>
    </AppLayout>
  );
}
