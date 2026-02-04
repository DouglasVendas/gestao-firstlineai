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
  Loader2,
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useClientsCount } from "@/hooks/useClients";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

export default function Index() {
  const { data: metrics, isLoading: isLoadingMetrics } = useDashboardData();
  const { data: activeClients, isLoading: isLoadingClients } = useClientsCount();

  if (isLoadingMetrics || isLoadingClients) {
    return (
      <AppLayout title="Dashboard Executivo" subtitle="Visão geral das métricas financeiras e operacionais">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const currentMonth = metrics?.[metrics.length - 1] || { mrr: 0, arr: 0, churn_rate: 0 };
  const previousMonth = metrics?.[metrics.length - 2] || { mrr: 0, arr: 0, churn_rate: 0 };

  const mrrChange = previousMonth.mrr ? ((currentMonth.mrr - previousMonth.mrr) / previousMonth.mrr) * 100 : 0;
  const arrChange = previousMonth.arr ? ((currentMonth.arr - previousMonth.arr) / previousMonth.arr) * 100 : 0;

  const churnRate = currentMonth.churn_rate || 0;

  // Mock LTV/CAC calculation or fetch if available
  const ltvCac = 5.3;

  return (
    <AppLayout
      title="Dashboard Executivo"
      subtitle="Visão geral das métricas financeiras e operacionais"
    >
      {/* Top Metrics */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="MRR"
          value={formatCurrency(currentMonth.mrr)}
          change={Number(mrrChange.toFixed(1))}
          icon={<DollarSign className="h-6 w-6" />}
          variant="primary"
        />
        <MetricCard
          title="ARR"
          value={formatCurrency(currentMonth.arr)}
          change={Number(arrChange.toFixed(1))}
          icon={<Calendar className="h-6 w-6" />}
          variant="success"
        />
        <MetricCard
          title="Clientes Ativos"
          value={(activeClients || 0).toString()}
          change={8.2} // Mock change for clients
          icon={<Users className="h-6 w-6" />}
          variant="primary"
        />
        <MetricCard
          title="Churn Rate"
          value={`${churnRate}%`}
          change={-18.5} // Mock change
          icon={<TrendingDown className="h-6 w-6" />}
          variant="success"
        />
        <MetricCard
          title="LTV:CAC"
          value={`${ltvCac}x`}
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
