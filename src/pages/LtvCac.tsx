import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, DollarSign, Clock, Target, Calculator, Loader2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useFinancialSnapshot, useFinancialHistory } from "@/hooks/useFinancialMetrics";
import { useFinancialData } from "@/contexts/FinancialContext";
import { isSameMonth, parseISO } from "date-fns";

export default function LtvCac() {
  const { clients, fixedCosts, variableCosts, selectedMonth, isLoading: isLoadingData } = useFinancialData();
  const { current, isLoading: isLoadingSnapshot } = useFinancialSnapshot();
  const history = useFinancialHistory();

  const [simulatorValues, setSimulatorValues] = useState({
    churnReduction: 0,
    arpaIncrease: 0,
    cacReduction: 0,
  });

  const ltvCacTrendData = useMemo(() => {
    if (!history.length) return [];
    return history.map(h => ({
      month: new Date(h.month + '-01').toLocaleString('pt-BR', { month: 'short' }),
      ltv: Math.round(h.ltv),
      cac: Math.round(h.cac),
      ratio: h.cac > 0 ? Number((h.ltv / h.cac).toFixed(2)) : 0
    }));
  }, [history]);

  // CAC Components for the current selected month
  const cacComponents = useMemo(() => {
    if (!fixedCosts || !variableCosts) return [];

    // Identical logic to useFinancialMetrics for identifying CAC expenses
    const isCacExpense = (category: string) => {
      const lower = category.toLowerCase();
      return ['marketing', 'vendas', 'comercial', 'ads', 'publicidade', 'comissão', 'facebook', 'google', 'instagram', 'linkedin'].some(k => lower.includes(k));
    };

    const relevantFixed = fixedCosts.filter(c => {
      // Assuming fixedCosts might have 'month' or apply generally? 
      // For LTV/CAC page, usually we want to see the breakdown for the selected period.
      if (c.month && !isSameMonth(parseISO(c.month), selectedMonth)) return false;
      return isCacExpense(c.category);
    });

    const relevantVariable = variableCosts.filter(c => {
      if (c.month && !isSameMonth(parseISO(c.month), selectedMonth)) return false;
      return isCacExpense(c.category);
    });

    // Group by category for the Pie Chart
    const stats: Record<string, number> = {};

    relevantFixed.forEach(c => {
      stats[c.category] = (stats[c.category] || 0) + Number(c.actual);
    });
    relevantVariable.forEach(c => {
      stats[c.category] = (stats[c.category] || 0) + Number(c.amount);
    });

    const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

    return Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }));

  }, [fixedCosts, variableCosts, selectedMonth]);

  // Simulator
  const baseLTV = current?.ltv || 0;
  const baseCAC = current?.cac || 0;

  const { simulatedLTV, simulatedCAC, simulatedRatio } = useMemo(() => {
    const sLTV = baseLTV * (1 + simulatorValues.churnReduction / 100) * (1 + simulatorValues.arpaIncrease / 100);
    const sCAC = baseCAC * (1 - simulatorValues.cacReduction / 100);
    const sRatio = sCAC > 0 ? sLTV / sCAC : 0;
    return { simulatedLTV: sLTV, simulatedCAC: sCAC, simulatedRatio: sRatio };
  }, [baseLTV, baseCAC, simulatorValues]);

  // LTV by Plan (Current Clients)
  const ltvByPlanData = useMemo(() => {
    if (!clients) return [];

    const planStats = clients.reduce((acc, client) => {
      // Basic check for status if we want to include churned or not?
      // Usually LTV by Plan considers all history or active? 
      // Let's iterate ALL clients to see "Average LTV" historical? 
      // Or just projected LTV of active clients? 
      // The previous logic was: `ltv: stats.count > 0 ? (stats.totalMrr / stats.count) * 30 : 0`
      // It assumed 30 months retention.
      // Let's keep a similar approximation or use the `baseLTV` factor?
      // Better to calculate ARPU per plan and divide by global Churn Rate for consistency.

      const planName = client.plan?.name || "Desconhecido";
      if (!acc[planName]) {
        acc[planName] = { totalMrr: 0, count: 0 };
      }
      // Use current MRR if active, or last MRR?
      // Assuming client.mrr is valid.
      acc[planName].totalMrr += client.mrr;
      acc[planName].count += 1;
      return acc;
    }, {} as Record<string, { totalMrr: number, count: number }>);

    const churnRateDecimal = current?.churnRate ? current.churnRate / 100 : 0.05; // Fallback 5% if 0
    // Avoid division by zero
    const effectiveChurn = churnRateDecimal === 0 ? 0.01 : churnRateDecimal;

    return Object.entries(planStats).map(([plan, stats], index) => {
      const arpu = stats.count > 0 ? stats.totalMrr / stats.count : 0;
      const ltv = arpu / effectiveChurn;
      return {
        plan,
        ltv,
        clients: stats.count,
        color: `hsl(var(--chart-${index + 1}))`
      };
    }).sort((a, b) => b.ltv - a.ltv);
  }, [clients, current]);

  if (isLoadingData || isLoadingSnapshot || !current) {
    return (
      <AppLayout title="LTV & CAC" subtitle="Lifetime Value e Custo de Aquisição de Clientes">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          icon={<TrendingUp className="h-6 w-6" />}
          description="Por cliente"
          variant="default"
        />
        <MetricCard
          title="CAC Médio"
          value={formatCurrency(baseCAC)}
          change={0}
          icon={<DollarSign className="h-6 w-6" />}
          description="Por aquisição"
          variant="default"
        />
        <MetricCard
          title="LTV:CAC Ratio"
          value={`${current.ratio || '0'}:1`}
          change={0}
          icon={<Target className="h-6 w-6" />}
          description="Meta: > 3:1"
          variant={
            (current.ratio || 0) >= 3 ? "success" :
              (current.ratio || 0) >= 1 ? "warning" : "danger"
          }
        />
        <MetricCard
          title="Payback Period"
          value={`${current.paybackTerm ? current.paybackTerm.toFixed(1) : '0'} meses`}
          change={0}
          icon={<Clock className="h-6 w-6" />}
          description="Tempo para recuperar CAC"
          variant="default"
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* LTV vs CAC Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Evolução LTV vs CAC (Últimos 12 Meses)</CardTitle>
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
                      <span className="text-muted-foreground">LTV Médio (Est.)</span>
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
              Dados reais de canais de aquisição ainda não implementados.
              <br />
              (Requer integração de atribuição)
            </div>
          </CardContent>
        </Card>

        {/* CAC Components */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Componentes do CAC ({selectedMonth.toLocaleDateString('pt-BR', { month: 'short' })})</CardTitle>
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
                  Custos de Marketing e Vendas do mês
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-center text-sm text-muted-foreground">
                Sem custos de marketing/vendas neste mês.
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
