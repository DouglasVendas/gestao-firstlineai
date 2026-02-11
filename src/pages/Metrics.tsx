import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Clock,
  BarChart3,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useFinancialData } from "@/contexts/FinancialContext";
import { useFinancialSnapshot, useFinancialHistory } from "@/hooks/useFinancialMetrics";
import { formatCurrency } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

export default function Metrics() {
  const { clients, isLoading: isLoadingData } = useFinancialData();
  const { current, isLoading: isLoadingSnapshot } = useFinancialSnapshot();
  const history = useFinancialHistory();

  const {
    currentMetric,
    netNewMrr,
    arpu,
    arpuChange,
    growthRate,
    mrrData
  } = useMemo(() => {
    if (!history || history.length === 0 || !current) return {
      currentMetric: null,
      netNewMrr: 0,
      arpu: 0,
      arpuChange: 0,
      growthRate: 0,
      mrrData: []
    };

    // Sort history by month asc
    const sortedHistory = [...history].sort((a, b) => a.month.localeCompare(b.month));

    // Find current month in history or use the last one
    // current.month is YYYY-MM
    const currIndex = sortedHistory.findIndex(h => h.month === current.month);
    const curr = currIndex >= 0 ? sortedHistory[currIndex] : sortedHistory[sortedHistory.length - 1];
    const prev = currIndex >= 1 ? sortedHistory[currIndex - 1] : (sortedHistory.length > 1 ? sortedHistory[sortedHistory.length - 2] : { mrr: 0, activeClients: 0 });

    // Net New MRR
    const netNew = curr.mrr - prev.mrr;

    // ARPU
    const currArpu = curr.activeClients > 0 ? curr.mrr / curr.activeClients : 0;
    const prevArpu = prev.activeClients > 0 ? prev.mrr / prev.activeClients : 0;
    const arpuChg = prevArpu > 0 ? ((currArpu - prevArpu) / prevArpu) * 100 : 0;

    // Growth Rate (MRR)
    const growth = prev.mrr > 0 ? ((curr.mrr - prev.mrr) / prev.mrr) * 100 : 0;

    // MRR Data for Chart
    const chartData = sortedHistory.map((m, i) => {
      const p = sortedHistory[i - 1] || { mrr: 0 };
      const diff = m.mrr - p.mrr;
      return {
        month: new Date(m.month + '-02').toLocaleString('pt-BR', { month: 'short' }),
        new: diff > 0 ? diff : 0,
        expansion: 0,
        contraction: 0,
        churn: diff < 0 ? Math.abs(diff) : 0
      };
    });

    return {
      currentMetric: curr,
      netNewMrr: netNew,
      arpu: currArpu,
      arpuChange: arpuChg,
      growthRate: growth,
      mrrData: chartData
    };
  }, [history, current]);

  const planDistribution = useMemo(() => {
    if (!clients) return [];

    const stats = clients.reduce((acc, client) => {
      if (client.status === 'churned') return acc;

      const planName = client.plan?.name || "Outros";
      acc[planName] = (acc[planName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(stats).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(stats).map(([name, count], index) => ({
      name,
      value: Math.round((count / total) * 100),
      color: `hsl(var(--chart-${index + 1}))`
    }));
  }, [clients]);

  // Advanced metrics from Current Snapshot
  const cac = current?.cac || 0;
  const ltv = current?.ltv || 0;
  const ltvCacRatio = current?.ratio || 0;
  const paybackPeriod = current?.paybackTerm || 0;

  const churnRevenue = useMemo(() => {
    if (!clients || !current) return 0;
    const currentMonthStr = current.month; // YYYY-MM
    return clients
      .filter(c => c.churn_date && c.churn_date.startsWith(currentMonthStr))
      .reduce((sum, c) => sum + (c.mrr || 0), 0);
  }, [clients, current]);


  if (isLoadingData || isLoadingSnapshot || !currentMetric) {
    return (
      <AppLayout title="Métricas SaaS" subtitle="Todas as métricas importantes para seu negócio">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Métricas SaaS"
      subtitle="Todas as métricas importantes para seu negócio"
    >
      {/* Revenue Metrics */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Métricas de Receita
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="MRR Total"
            value={formatCurrency(currentMetric.mrr)}
            change={growthRate}
            icon={<DollarSign className="h-6 w-6" />}
            variant="default"
          />
          <MetricCard
            title="ARR"
            value={formatCurrency(currentMetric.arr)}
            change={growthRate}
            icon={<BarChart3 className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="ARPU"
            value={formatCurrency(arpu)}
            change={arpuChange}
            icon={<Users className="h-6 w-6" />}
            variant="default"
          />
          <MetricCard
            title="Net New MRR"
            value={formatCurrency(netNewMrr)}
            change={growthRate}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="success"
          />
        </div>
      </section>

      {/* MRR Components Chart */}
      <section className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="metric-card lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Componentes do MRR
          </h3>
          <div className="h-[300px]">
            {mrrData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mrrData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(val) => new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(val)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="new"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                    name="Novo MRR"
                  />
                  <Area
                    type="monotone"
                    dataKey="churn"
                    stackId="1"
                    stroke="hsl(var(--destructive))"
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.6}
                    name="Churn"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Sem dados históricos de MRR.
              </div>
            )}
          </div>
        </div>

        <div className="metric-card">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Distribuição por Plano (Ativos)
          </h3>
          <div className="h-[200px]">
            {planDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => `${value}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Sem clientes ativos.
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {planDistribution.map((plan) => (
              <div key={plan.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: plan.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {plan.name}
                  </span>
                </div>
                <span className="font-mono text-sm font-medium text-foreground">
                  {plan.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Growth & Efficiency Metrics */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Crescimento & Eficiência
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Growth Rate Mensal"
            value={`${growthRate.toFixed(1)}%`}
            change={0}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Quick Ratio"
            value="N/A"
            change={0}
            changeLabel="ideal > 4"
            icon={<Zap className="h-6 w-6" />}
            variant="default" // No data
          />
          <MetricCard
            title="Magic Number"
            value="N/A"
            change={0}
            changeLabel="ideal > 0.75"
            icon={<Target className="h-6 w-6" />}
            variant="default"
          />
          <MetricCard
            title="Rule of 40"
            value="N/A"
            change={0}
            changeLabel="ideal > 40%"
            icon={<BarChart3 className="h-6 w-6" />}
            variant="default"
          />
        </div>
      </section>

      {/* Churn & Retention */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Churn & Retenção
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Churn Rate (Clientes)"
            value={`${currentMetric.churnRate?.toFixed(1) || 0}%`}
            change={0}
            icon={<TrendingDown className="h-6 w-6" />}
            variant={currentMetric.churnRate > 5 ? "danger" : "default"}
          />
          <MetricCard
            title="Churn Rate (Receita)"
            value={formatCurrency(churnRevenue)}
            change={0}
            icon={<DollarSign className="h-6 w-6" />}
            description="Perdido este mês"
            variant="default"
          />
          <MetricCard
            title="Net Revenue Retention"
            value="N/A"
            change={0}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="default"
          />
          <MetricCard
            title="Gross Revenue Retention"
            value="N/A"
            change={0}
            icon={<BarChart3 className="h-6 w-6" />}
            variant="default" // No data
          />
        </div>
      </section>

      {/* LTV & CAC */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          LTV & CAC
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="LTV"
            value={formatCurrency(ltv)}
            change={0}
            icon={<DollarSign className="h-6 w-6" />}
            variant="default"
          />
          <MetricCard
            title="CAC"
            value={formatCurrency(cac)}
            change={0}
            icon={<Target className="h-6 w-6" />}
            variant="default"
          />
          <MetricCard
            title="LTV:CAC Ratio"
            value={`${ltvCacRatio.toFixed(1)}x`}
            change={0}
            changeLabel="ideal > 3x"
            icon={<BarChart3 className="h-6 w-6" />}
            variant={ltvCacRatio >= 3 ? "success" : "warning"}
          />
          <MetricCard
            title="CAC Payback"
            value={`${paybackPeriod.toFixed(1)} meses`}
            change={0}
            changeLabel="ideal < 12 meses"
            icon={<Clock className="h-6 w-6" />}
            variant={paybackPeriod <= 12 ? "success" : "warning"}
          />
        </div>
      </section>
    </AppLayout>
  );
}
