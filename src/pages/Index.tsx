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
// import { useDashboardData } from "@/hooks/useDashboardData"; // Deprecated
// import { useClientsCount } from "@/hooks/useClients"; // Deprecated
import { useFinancials } from "@/hooks/useFinancials";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

export default function Index() {
  const { data: financials, isLoading } = useFinancials();

  if (isLoading) {
    return (
      <AppLayout title="Dashboard Executivo" subtitle="Visão geral das métricas financeiras e operacionais">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Get the last complete month (or current running month)
  const currentMonth = financials?.[financials.length - 1] || {
    mrr: 0, arr: 0, churn_rate: 0, revenue: 0, active_clients: 0
  };
  const previousMonth = financials?.[financials.length - 2] || {
    mrr: 0, arr: 0, churn_rate: 0, revenue: 0, active_clients: 0
  };

  const mrrChange = previousMonth.mrr ? ((currentMonth.mrr - previousMonth.mrr) / previousMonth.mrr) * 100 : 0;
  const arrChange = previousMonth.arr ? ((currentMonth.arr - previousMonth.arr) / previousMonth.arr) * 100 : 0;

  // Calculate client growth
  const clientsChange = previousMonth.active_clients ?
    ((currentMonth.active_clients - previousMonth.active_clients) / previousMonth.active_clients) * 100 : 0;

  const churnRate = currentMonth.churn_rate || 0;

  // Mock LTV/CAC calculation or can be derived if we add CAC logic to useFinancials
  // For now, keep mock or simpler derivation if possible
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
          value={(currentMonth.active_clients || 0).toString()}
          change={Number(clientsChange.toFixed(1))}
          icon={<Users className="h-6 w-6" />}
          variant="primary"
        />
        <MetricCard
          title="Churn Rate"
          value={`${churnRate.toFixed(1)}%`}
          change={0} // To implement change logic
          icon={<TrendingDown className="h-6 w-6" />}
          variant="success"
        />
        <MetricCard
          title="LTV:CAC"
          value={`${ltvCac}x`}
          change={0}
          icon={<Target className="h-6 w-6" />}
          variant="success"
        />
        <MetricCard
          title="Receita (Caixa)"
          value={formatCurrency(currentMonth.revenue)}
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
