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
  const { data: metrics, isLoading: isLoadingMetrics } = useDashboardData();
  const { data: clients, isLoading: isLoadingClients } = useClients();

  const {
    currentMetric,
    netNewMrr,
    arpu,
    arpuChange,
    growthRate,
    mrrData
  } = useMemo(() => {
    if (!metrics || metrics.length === 0 || !clients) return {
      currentMetric: { mrr: 0, arr: 0, churn_rate: 0, month: "" },
      netNewMrr: 0,
      arpu: 0,
      arpuChange: 0,
      growthRate: 0,
      mrrData: []
    };

    // Helper to get formatted month key (e.g. "2024-01")
    const getMonthKey = (dateStr: string) => dateStr.substring(0, 7);
    const getEndOfMonth = (monthStr: string) => {
      const [year, month] = monthStr.split('-').map(Number);
      return new Date(year, month, 0); // Last day of that month
    }

    // Calculate Active Customers per Month
    const activeCustomersByMonth: Record<string, number> = {};
    const clientperiods = clients.map(c => ({
      start: c.start_date ? new Date(c.start_date) : new Date(c.created_at),
      end: c.churn_date ? new Date(c.churn_date) : null
    }));

    metrics.forEach(m => {
      const monthKey = m.month.substring(0, 7);
      const monthEnd = getEndOfMonth(monthKey);

      let active = 0;
      clientperiods.forEach(p => {
        if (p.start <= monthEnd && (!p.end || p.end > monthEnd)) {
          active++;
        }
      });
      activeCustomersByMonth[monthKey] = active;
    });

    const current = metrics?.[metrics.length - 1] || { mrr: 0, arr: 0, churn_rate: 0, month: "" };
    const previous = metrics?.[metrics.length - 2] || { mrr: 0, arr: 0, month: "" };

    // Get customers count for current and previous
    const currentKey = current.month ? current.month.substring(0, 7) : "";
    const previousKey = previous.month ? previous.month.substring(0, 7) : "";

    const curCustomers = activeCustomersByMonth[currentKey] || 0;
    const prevCustomers = activeCustomersByMonth[previousKey] || 0;

    // Net New MRR
    const netNew = current.mrr - previous.mrr;

    // ARPU
    const currArpu = curCustomers > 0 ? current.mrr / curCustomers : 0;
    const prevArpu = prevCustomers > 0 ? previous.mrr / prevCustomers : 0;
    const arpuChg = prevArpu > 0 ? ((currArpu - prevArpu) / prevArpu) * 100 : 0;

    // Growth Rate
    const growth = previous.mrr > 0 ? ((current.mrr - previous.mrr) / previous.mrr) * 100 : 0;

    // MRR Data for Chart
    const chartData = metrics?.map((m, i) => {
      const prev = metrics[i - 1] || { mrr: 0 };
      const diff = m.mrr - prev.mrr;
      // Without real breakdown, we simplify:
      // Positive diff -> New
      // Negative diff -> Churn
      return {
        month: new Date(m.month + '-02').toLocaleString('default', { month: 'short' }),
        new: diff > 0 ? diff : 0,
        expansion: 0, // No expansion data in current schema
        contraction: 0, // No contraction data in current schema
        churn: diff < 0 ? Math.abs(diff) : 0
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
  }, [metrics, clients]);

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
            Distribuição por Plano
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
                Sem clientes.
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
            variant="success"
          />
          <MetricCard
            title="Magic Number"
            value="N/A"
            change={0}
            changeLabel="ideal > 0.75"
            icon={<Target className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Rule of 40"
            value="N/A"
            change={0}
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
            value={`${currentMetric.churn_rate || 0}%`}
            change={0}
            icon={<TrendingDown className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Churn Rate (Receita)"
            value="N/A"
            change={0}
            icon={<DollarSign className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Net Revenue Retention"
            value="N/A"
            change={0}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Gross Revenue Retention"
            value="N/A"
            change={0}
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
            value={formatCurrency(arpu / ((currentMetric.churn_rate || 1) / 100))}
            change={0}
            icon={<DollarSign className="h-6 w-6" />}
            variant="primary"
          />
          <MetricCard
            title="CAC"
            value="N/A"
            change={0}
            icon={<Target className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="LTV:CAC Ratio"
            value="N/A"
            change={0}
            changeLabel="ideal > 3x"
            icon={<BarChart3 className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="CAC Payback"
            value="N/A"
            change={0}
            changeLabel="ideal < 12 meses"
            icon={<Clock className="h-6 w-6" />}
            variant="success"
          />
        </div>
      </section>
    </AppLayout>
  );
}
