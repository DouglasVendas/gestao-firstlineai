import { MetricCard } from "@/components/dashboard/MetricCard";
import { usePageTitle } from "@/contexts/PageTitleContext";
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
import { RenewalWidget } from "@/components/dashboard/RenewalWidget";
import { useFinancialSnapshot, useFinancialHistory } from "@/hooks/useFinancialMetrics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GrowthMetrics } from "@/components/dashboard/growth/GrowthMetrics";
import { RetentionMetrics } from "@/components/dashboard/retention/RetentionMetrics";

import { useSettings } from "@/hooks/useSettings";
import React from "react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

export default function Index() {
  const { current, previous, isLoading } = useFinancialSnapshot();
  const { settings } = useSettings();
  const history = useFinancialHistory();
  const { setPageTitle } = usePageTitle();

  // Set page title on mount
  React.useEffect(() => {
    setPageTitle("Dashboard Executivo", "Visão geral das métricas financeiras e operacionais");
  }, [setPageTitle]);

  if (isLoading || !current) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate changes
  const calculateChange = (currentVal: number, prevVal: number) => {
    if (!prevVal) return 0;
    return ((currentVal - prevVal) / prevVal) * 100;
  };

  const mrrChange = calculateChange(current.mrr, previous?.mrr || 0);
  const arrChange = calculateChange(current.arr, previous?.arr || 0);
  const clientsChange = calculateChange(current.activeClients, previous?.activeClients || 0);

  return (
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="growth">Growth & Eficiência</TabsTrigger>
          <TabsTrigger value="retention">Churn & Retenção</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB (Current Dashboard) */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="MRR"
              value={formatCurrency(current.mrr)}
              change={Number(mrrChange.toFixed(1))}
              icon={<DollarSign className="h-6 w-6" />}
              variant="primary"
            />
            <MetricCard
              title="ARR"
              value={formatCurrency(current.arr)}
              change={Number(arrChange.toFixed(1))}
              icon={<Calendar className="h-6 w-6" />}
              variant="success"
            />
            <MetricCard
              title="Clientes Ativos"
              value={current.activeClients.toString()}
              change={Number(clientsChange.toFixed(1))}
              icon={<Users className="h-6 w-6" />}
              variant="primary"
            />
            <MetricCard
              title="Churn Rate"
              value={`${current.churnRate.toFixed(1)}%`}
              change={0}
              icon={<TrendingDown className="h-6 w-6" />}
              variant="success"
            />
            <MetricCard
              title="LTV:CAC"
              value={`${current.ratio.toFixed(1)}x`}
              change={0}
              icon={<Target className="h-6 w-6" />}
              variant="success"
            />
            <MetricCard
              title="Receita (Caixa)"
              value={formatCurrency(current.revenue)}
              change={0}
              icon={<Wallet className="h-6 w-6" />}
              variant="warning"
            />
            <MetricCard
              title="Saldo (Caixa)"
              value={formatCurrency(current.cashBalance)}
              change={0}
              icon={<Wallet className="h-6 w-6" />}
              variant="primary"
              allowPrivacy={true}
            />
            <MetricCard
              title="Saldo (Caixa)"
              value={formatCurrency(current.cashBalance)}
              change={0}
              icon={<Wallet className="h-6 w-6" />}
              variant="primary"
              allowPrivacy={true}
            />
          </div>

          {/* Goal Widget */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold leading-none tracking-tight">Meta de Receita (MRR)</h3>
                  <p className="text-sm text-muted-foreground">Progresso em relação ao objetivo anual.</p>
                </div>
                <Target className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{formatCurrency(current.mrr)}</span>
                  <span className="text-muted-foreground">{((current.mrr / settings.mrr_goal) * 100).toFixed(1)}%</span>
                  <span className="font-medium text-muted-foreground">Meta: {formatCurrency(settings.mrr_goal)}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-in-out"
                    style={{ width: `${Math.min(((current.mrr / settings.mrr_goal) * 100), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart />
            <MRRMovementChart />
          </div>

          {/* Secondary Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* LTV/Churn charts kept here for quick view, or could be removed if redundant */}
            <ChurnChart />
            <RenewalWidget />
          </div>

          {/* Bottom Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ClientsTable />
            </div>
            <QuickStats current={current} previous={previous} />
          </div>
        </TabsContent>

        {/* GROWTH TAB */}
        <TabsContent value="growth">
          <GrowthMetrics currentMetric={current} history={history} />
        </TabsContent>

        {/* RETENTION TAB */}
        <TabsContent value="retention">
          <RetentionMetrics currentMetric={current} history={history} />
        </TabsContent>

      </Tabs>
  );
}
