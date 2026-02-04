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

const mrrData = [
  { month: "Jan", new: 12000, expansion: 8000, contraction: -3000, churn: -5000 },
  { month: "Fev", new: 15000, expansion: 6000, contraction: -2500, churn: -4000 },
  { month: "Mar", new: 11000, expansion: 9000, contraction: -4000, churn: -6000 },
  { month: "Abr", new: 18000, expansion: 7000, contraction: -2000, churn: -3500 },
  { month: "Mai", new: 14000, expansion: 10000, contraction: -3500, churn: -4500 },
  { month: "Jun", new: 20000, expansion: 8500, contraction: -2500, churn: -4000 },
];

const planDistribution = [
  { name: "Enterprise", value: 45, color: "hsl(var(--primary))" },
  { name: "Pro", value: 35, color: "hsl(var(--success))" },
  { name: "Basic", value: 15, color: "hsl(var(--warning))" },
  { name: "Trial", value: 5, color: "hsl(var(--muted-foreground))" },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

export default function Metrics() {
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
            value="R$ 124.000"
            change={10.7}
            icon={<DollarSign className="h-6 w-6" />}
            variant="primary"
          />
          <MetricCard
            title="ARR"
            value="R$ 1,49M"
            change={10.7}
            icon={<BarChart3 className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="ARPU"
            value="R$ 667"
            change={4.2}
            icon={<Users className="h-6 w-6" />}
            variant="primary"
          />
          <MetricCard
            title="Net New MRR"
            value="R$ 14.000"
            change={22.8}
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
                  tickFormatter={formatCurrency}
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
            value="1.5%"
            change={-18.5}
            icon={<TrendingDown className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Churn Rate (Receita)"
            value="1.2%"
            change={-22.1}
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
            value="R$ 21.000"
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
