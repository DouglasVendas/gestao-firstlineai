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
import { useDashboardData } from "@/hooks/useDashboardData";
import { useClients } from "@/hooks/useClients";
import { formatCurrency } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

export default function Metrics() {
  const { metrics, isLoading: isLoadingMetrics } = useDashboardData();
  const { data: clients, isLoading: isLoadingClients } = useClients();

  const {
    currentMetric,
    netNewMrr,
    arpu,
    arpuChange,
    growthRate,
    mrrData
  } = useMemo(() => {
    const current = metrics?.[metrics.length - 1] || { mrr: 0, arr: 0, customers_count: 0, churn_rate: 0, month: "" };
    const previous = metrics?.[metrics.length - 2] || { mrr: 0, arr: 0, customers_count: 0 };

    // Net New MRR
    const netNew = current.mrr - previous.mrr;

    // ARPU
    const currArpu = current.customers_count > 0 ? current.mrr / current.customers_count : 0;
    const prevArpu = previous.customers_count > 0 ? previous.mrr / previous.customers_count : 0;
    const arpuChg = prevArpu > 0 ? ((currArpu - prevArpu) / prevArpu) * 100 : 0;

    // Growth Rate
    const growth = previous.mrr > 0 ? ((current.mrr - previous.mrr) / previous.mrr) * 100 : 0;

    // MRR Data for Chart
    const chartData = metrics?.map((m, i) => {
      const prev = metrics[i - 1] || { mrr: 0 };
      const diff = m.mrr - prev.mrr;
      return {
        month: new Date(m.month + '-02').toLocaleString('default', { month: 'short' }),
        new: diff > 0 ? diff : 0,
        expansion: diff > 0 ? diff * 0.2 : 0, // Mock
        contraction: diff < 0 ? Math.abs(diff) : 0, // Mock
        churn: m.churn_rate > 0 ? (m.mrr * m.churn_rate / 100) : 0 // Approx churn volume
      };
    }) || [];

    return {
      currentMetric: current,
      netNewMrr: netNew,
      arpu: currArpu,
      arpuChange: arpuChg,
      growthRate: growth,
      mrrData: chartData
    };
  }, [metrics]);

  const planDistribution = useMemo(() => {
    if (!clients) return [];

    const stats = clients.reduce((acc, client) => {
      const planName = client.plan?.name || "Outros";
      acc[planName] = (acc[planName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = clients.length || 1;
    return Object.entries(stats).map(([name, count], index) => ({
      name,
      value: Math.round((count / total) * 100),
      color: `hsl(var(--chart-${index + 1}))`
    }));
  }, [clients]);

  if (isLoadingMetrics || isLoadingClients) {
    return (
      <AppLayout title="Métricas SaaS" subtitle="Todas as métricas importantes para seu negócio">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-[300px] w-full lg:col-span-2" />
            <Skeleton className="h-[300px] w-full" />
          </div>
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
            variant="primary"
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
            variant="primary"
          />
          <MetricCard
            title="Net New MRR"
            value={formatCurrency(netNewMrr)}
            change={growthRate} // Correlated
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
                  dataKey="expansion"
                  stackId="1"
                  stroke="hsl(var(--success))"
                  fill="hsl(var(--success))"
                  fillOpacity={0.6}
                  name="Expansão"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="metric-card">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Distribuição por Plano
          </h3>
          <div className="h-[200px]">
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
            value="10.7%"
            change={2.3}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Quick Ratio"
            value="4.2"
            change={8.5}
            changeLabel="ideal > 4"
            icon={<Zap className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Magic Number"
            value="0.92"
            change={12.4}
            changeLabel="ideal > 0.75"
            icon={<Target className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Rule of 40"
            value="52%"
            change={4.0}
            changeLabel="ideal > 40%"
            icon={<BarChart3 className="h-6 w-6" />}
            variant="success"
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
            value={`${currentMetric.churn_rate}%`}
            change={-0.5} // Mock change
            icon={<TrendingDown className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Churn Rate (Receita)"
            value={`${(currentMetric.churn_rate * 1.1).toFixed(1)}%`}
            change={-1.1} // Mock change
            icon={<DollarSign className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Net Revenue Retention"
            value="118%"
            change={5.4}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Gross Revenue Retention"
            value="95%"
            change={2.1}
            icon={<BarChart3 className="h-6 w-6" />}
            variant="primary"
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
            value={formatCurrency(arpu / (currentMetric.churn_rate / 100 || 0.05))}
            change={14.8}
            icon={<DollarSign className="h-6 w-6" />}
            variant="primary"
          />
          <MetricCard
            title="CAC"
            value="R$ 4.000"
            change={-5.2}
            icon={<Target className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="LTV:CAC Ratio"
            value="5.3x"
            change={21.3}
            changeLabel="ideal > 3x"
            icon={<BarChart3 className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="CAC Payback"
            value="6 meses"
            change={-14.3}
            changeLabel="ideal < 12 meses"
            icon={<Clock className="h-6 w-6" />}
            variant="success"
          />
        </div>
      </section>
    </AppLayout>
  );
}
