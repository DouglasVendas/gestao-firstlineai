import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, DollarSign, Clock, Target, Calculator } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useClients } from "@/hooks/useClients";
import { useFixedCosts } from "@/hooks/useFixedCosts";
import { useVariableCosts } from "@/hooks/useVariableCosts";
import { Skeleton } from "@/components/ui/skeleton";

export default function LtvCac() {
  const { data: metrics, isLoading: isLoadingMetrics } = useDashboardData();
  const { data: clients, isLoading: isLoadingClients } = useClients();
  const { data: fixedCosts, isLoading: isLoadingFixed } = useFixedCosts();
  const { data: variableCosts, isLoading: isLoadingVariable } = useVariableCosts();

  const [simulatorValues, setSimulatorValues] = useState({
    churnReduction: 0,
    arpaIncrease: 0,
    cacReduction: 0,
  });

  const { ltvCacTrendData, currentMetric, cacComponents, cacByChannel } = useMemo(() => {
    if (!metrics || metrics.length === 0 || !clients) return {
      ltvCacTrendData: [],
      currentMetric: { ltv: 0, cac: 0, ratio: 0, payback: 0 },
      cacComponents: [],
      cacByChannel: []
    };

    // Helper to get formatted month key (e.g. "2024-01")
    const getMonthKey = (dateStr: string) => dateStr.substring(0, 7);
    const getEndOfMonth = (monthStr: string) => {
      const [year, month] = monthStr.split('-').map(Number);
      return new Date(year, month, 0); // Last day of that month
    }

    // 1. Calculate Costs per Month (Marketing + Sales)
    const costsByMonth: Record<string, number> = {};

    fixedCosts?.forEach(cost => {
      if (!cost.month) return;
      const month = getMonthKey(cost.month);
      if (['Marketing', 'Vendas', 'Comercial', 'Publicidade'].some(c => cost.category.includes(c))) {
        costsByMonth[month] = (costsByMonth[month] || 0) + cost.actual;
      }
    });

    variableCosts?.forEach(cost => {
      const month = getMonthKey(cost.month);
      if (['Anúncios', 'Comissão', 'Marketing', 'Ads'].some(c => cost.category.includes(c))) {
        costsByMonth[month] = (costsByMonth[month] || 0) + cost.amount;
      }
    });

    // 2. Calculate New & Active Customers per Month
    const newCustomersByMonth: Record<string, number> = {};
    const activeCustomersByMonth: Record<string, number> = {};

    // For active customers, we need to iterate months in metrics and count
    // Pre-process clients:
    const clientperiods = clients.map(c => ({
      start: c.start_date ? new Date(c.start_date) : new Date(c.created_at),
      end: c.churn_date ? new Date(c.churn_date) : null
    }));

    metrics.forEach(m => {
      const monthKey = m.month.substring(0, 7);
      const monthEnd = getEndOfMonth(monthKey);

      // Count active
      let active = 0;
      clientperiods.forEach(p => {
        if (p.start <= monthEnd && (!p.end || p.end > monthEnd)) {
          active++;
        }
      });
      activeCustomersByMonth[monthKey] = active;
    });

    clients.forEach(client => {
      const date = new Date(client.created_at);
      const month = date.toISOString().substring(0, 7);
      newCustomersByMonth[month] = (newCustomersByMonth[month] || 0) + 1;
    });

    // 3. Build Trend Data
    const trends = metrics.map(m => {
      const monthKey = m.month.substring(0, 7);
      const customers = activeCustomersByMonth[monthKey] || 0;
      const arpu = customers > 0 ? m.mrr / customers : 0;
      const churn = m.churn_rate > 0 ? m.churn_rate / 100 : 0; // If churn is 0, LTV is infinite, handle safely
      const ltv = churn > 0 ? arpu / churn : arpu * 24; // Fallback to 24 months cap if 0 churn

      const monthlyCost = costsByMonth[monthKey] || 0;
      const newCtx = newCustomersByMonth[monthKey] || 0;
      const cac = newCtx > 0 ? monthlyCost / newCtx : 0;

      return {
        month: new Date(m.month + '-02').toLocaleString('default', { month: 'short' }),
        ltv: Math.round(ltv),
        cac: Math.round(cac),
        ratio: cac > 0 ? Number((ltv / cac).toFixed(2)) : 0,
        payback: cac > 0 && arpu > 0 ? cac / arpu : 0
      };
    });

    const curr = trends[trends.length - 1] || { ltv: 0, cac: 0, ratio: 0, payback: 0 };

    // Mock breakdown for visualization since we aggregated everything
    const components = [
      { name: 'Marketing (Fixo)', value: 0.4 * curr.cac, color: 'hsl(var(--chart-1))' },
      { name: 'Vendas (Fixo)', value: 0.3 * curr.cac, color: 'hsl(var(--chart-2))' },
      { name: 'Ads (Variável)', value: 0.2 * curr.cac, color: 'hsl(var(--chart-3))' },
      { name: 'Comissões', value: 0.1 * curr.cac, color: 'hsl(var(--chart-4))' },
    ].filter(c => c.value > 0);

    return {
      ltvCacTrendData: trends,
      currentMetric: curr,
      cacComponents: components,
      cacByChannel: [] // Still no channel data in DB
    };
  }, [metrics, clients, fixedCosts, variableCosts]);

  const baseLTV = currentMetric.ltv;
  const baseCAC = currentMetric.cac;

  const { simulatedLTV, simulatedCAC, simulatedRatio } = useMemo(() => {
    const sLTV = baseLTV * (1 + simulatorValues.churnReduction / 100) * (1 + simulatorValues.arpaIncrease / 100);
    const sCAC = baseCAC * (1 - simulatorValues.cacReduction / 100);
    const sRatio = sCAC > 0 ? sLTV / sCAC : 0;
    return { simulatedLTV: sLTV, simulatedCAC: sCAC, simulatedRatio: sRatio };
  }, [baseLTV, baseCAC, simulatorValues]);

  const ltvByPlanData = useMemo(() => {
    if (!clients) return [];

    const planStats = clients.reduce((acc, client) => {
      const planName = client.plan?.name || "Desconhecido";
      if (!acc[planName]) {
        acc[planName] = { totalMrr: 0, count: 0, color: "hsl(var(--primary))" };
      }
      acc[planName].totalMrr += client.mrr;
      acc[planName].count += 1;
      return acc;
    }, {} as Record<string, { totalMrr: number, count: number, color: string }>);

    return Object.entries(planStats).map(([plan, stats], index) => ({
      plan,
      ltv: stats.count > 0 ? (stats.totalMrr / stats.count) * 30 : 0, // Approx LTV assuming 30 months retention if unknown
      clients: stats.count,
      color: `hsl(var(--chart-${index + 1}))`
    }));
  }, [clients]);

  if (isLoadingMetrics || isLoadingClients || isLoadingFixed || isLoadingVariable) {
    return (
      <AppLayout title="LTV & CAC" subtitle="Lifetime Value e Custo de Aquisição de Clientes">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-[300px] w-full" />
          <div className="grid gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[250px] w-full" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="LTV & CAC"
      subtitle="Lifetime Value e Custo de Aquisição de Clientes"
    >
      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="LTV Médio"
          value={formatCurrency(baseLTV)}
          change={0}
          icon={TrendingUp}
          description="Por cliente"
        />
        <MetricCard
          title="CAC Médio"
          value={formatCurrency(baseCAC)}
          change={0}
          icon={DollarSign}
          description="Por aquisição"
        />
        <MetricCard
          title="LTV:CAC Ratio"
          value={`${currentMetric.ratio}:1`}
          change={0}
          icon={Target}
          description="Meta: > 3:1"
        />
        <MetricCard
          title="Payback Period"
          value={`${currentMetric.payback.toFixed(1)} meses`}
          change={0}
          icon={Clock}
          description="Tempo para recuperar CAC"
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* LTV vs CAC Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Evolução LTV vs CAC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {ltvCacTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ltvCacTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === "ratio") return [value.toFixed(2), "LTV:CAC"];
                        return [`R$ ${value.toLocaleString()}`, name === "ltv" ? "LTV" : "CAC"];
                      }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="ltv" name="LTV" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: 'hsl(var(--success))' }} />
                    <Line yAxisId="left" type="monotone" dataKey="cac" name="CAC" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ fill: 'hsl(var(--destructive))' }} />
                    <Line yAxisId="right" type="monotone" dataKey="ratio" name="LTV:CAC" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: 'hsl(var(--primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Sem dados suficientes para exibir o gráfico.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* LTV by Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">LTV por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            {ltvByPlanData.length > 0 ? (
              <div className="space-y-4">
                {ltvByPlanData.map((plan) => (
                  <div key={plan.plan} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: plan.color }} />
                        <span className="font-medium">{plan.plan}</span>
                      </div>
                      <Badge variant="secondary">{plan.clients} clientes</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">LTV Médio</span>
                      <span className="font-medium">{formatCurrency(plan.ltv)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Sem dados de clientes.
              </div>
            )}
          </CardContent>
        </Card>

        {/* CAC by Channel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CAC por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-center text-sm text-muted-foreground">
              Dados reais de canais de aquisição ainda não implementados no banco de dados.
              <br />
              Use a Importação de Dados para adicionar.
            </div>
          </CardContent>
        </Card>

        {/* CAC Components */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Componentes do CAC</CardTitle>
          </CardHeader>
          <CardContent>
            {cacComponents.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cacComponents}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {cacComponents.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 text-center text-sm text-muted-foreground">
                  Estimativa baseada no CAC Total
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-center text-sm text-muted-foreground">
                Aguardando dados de custos de marketing.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Simulator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5" />
            Simulador "E se..."
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Redução no Churn: {simulatorValues.churnReduction}%</Label>
                <Slider
                  value={[simulatorValues.churnReduction]}
                  onValueChange={([v]) => setSimulatorValues({ ...simulatorValues, churnReduction: v })}
                  min={0}
                  max={50}
                  step={5}
                />
              </div>
              <div className="space-y-3">
                <Label>Aumento no ARPA: {simulatorValues.arpaIncrease}%</Label>
                <Slider
                  value={[simulatorValues.arpaIncrease]}
                  onValueChange={([v]) => setSimulatorValues({ ...simulatorValues, arpaIncrease: v })}
                  min={0}
                  max={50}
                  step={5}
                />
              </div>
              <div className="space-y-3">
                <Label>Redução no CAC: {simulatorValues.cacReduction}%</Label>
                <Slider
                  value={[simulatorValues.cacReduction]}
                  onValueChange={([v]) => setSimulatorValues({ ...simulatorValues, cacReduction: v })}
                  min={0}
                  max={50}
                  step={5}
                />
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-6">
              <h4 className="mb-4 font-semibold">Resultado da Simulação</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-background p-4 text-center">
                  <p className="text-sm text-muted-foreground">Novo LTV</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(simulatedLTV)}</p>
                  <p className="text-xs text-muted-foreground">
                    {simulatedLTV > baseLTV ? "+" : ""}{baseLTV > 0 ? ((simulatedLTV - baseLTV) / baseLTV * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="rounded-lg bg-background p-4 text-center">
                  <p className="text-sm text-muted-foreground">Novo CAC</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(simulatedCAC)}</p>
                  <p className="text-xs text-muted-foreground">
                    {simulatedCAC < baseCAC ? "-" : "+"}{baseCAC > 0 ? Math.abs((simulatedCAC - baseCAC) / baseCAC * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="rounded-lg bg-background p-4 text-center">
                  <p className="text-sm text-muted-foreground">Novo Ratio</p>
                  <p className="text-2xl font-bold text-primary">{simulatedRatio.toFixed(2)}:1</p>
                  <Badge variant={simulatedRatio >= 3 ? "default" : "destructive"} className={simulatedRatio >= 3 ? "bg-success/10 text-success" : ""}>
                    {simulatedRatio >= 5 ? "Excelente" : simulatedRatio >= 3 ? "Bom" : "Melhorar"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
