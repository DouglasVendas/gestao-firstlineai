import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { useState } from "react";

const ltvCacTrendData = [
  { month: "Jul", ltv: 28500, cac: 8500, ratio: 3.35 },
  { month: "Ago", ltv: 29200, cac: 8200, ratio: 3.56 },
  { month: "Set", ltv: 30100, cac: 7800, ratio: 3.86 },
  { month: "Out", ltv: 31500, cac: 7500, ratio: 4.20 },
  { month: "Nov", ltv: 32800, cac: 7200, ratio: 4.56 },
  { month: "Dez", ltv: 33500, cac: 7000, ratio: 4.79 },
  { month: "Jan", ltv: 34200, cac: 6800, ratio: 5.03 },
];

const ltvByPlanData = [
  { plan: "Básico", ltv: 8970, clients: 25, color: "hsl(var(--chart-1))" },
  { plan: "Pro", ltv: 26700, clients: 55, color: "hsl(var(--chart-2))" },
  { plan: "Enterprise", ltv: 135000, clients: 20, color: "hsl(var(--chart-3))" },
];

const cacByChannelData = [
  { channel: "Google Ads", cac: 4500, clients: 12 },
  { channel: "LinkedIn Ads", cac: 6200, clients: 8 },
  { channel: "Orgânico/SEO", cac: 1200, clients: 35 },
  { channel: "Indicação", cac: 800, clients: 28 },
  { channel: "Eventos", cac: 8500, clients: 5 },
];

const cacComponentsData = [
  { name: "Marketing Digital", value: 45000, color: "hsl(var(--chart-1))" },
  { name: "Time de Vendas", value: 85000, color: "hsl(var(--chart-2))" },
  { name: "Ferramentas", value: 12000, color: "hsl(var(--chart-3))" },
  { name: "Eventos", value: 18000, color: "hsl(var(--chart-4))" },
];

export default function LtvCac() {
  const [simulatorValues, setSimulatorValues] = useState({
    churnReduction: 0,
    arpaIncrease: 0,
    cacReduction: 0,
  });

  const baseLTV = 34200;
  const baseCAC = 6800;

  const simulatedLTV = baseLTV * (1 + simulatorValues.churnReduction / 100) * (1 + simulatorValues.arpaIncrease / 100);
  const simulatedCAC = baseCAC * (1 - simulatorValues.cacReduction / 100);
  const simulatedRatio = simulatedLTV / simulatedCAC;

  return (
    <AppLayout
      title="LTV & CAC"
      subtitle="Lifetime Value e Custo de Aquisição de Clientes"
    >
      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="LTV Médio"
          value="R$ 34.200"
          change={{ value: 5.8, isPositive: true }}
          icon={TrendingUp}
          description="Por cliente"
        />
        <MetricCard
          title="CAC Médio"
          value="R$ 6.800"
          change={{ value: 8.2, isPositive: true }}
          icon={DollarSign}
          description="Por aquisição"
        />
        <MetricCard
          title="LTV:CAC Ratio"
          value="5.03:1"
          change={{ value: 12, isPositive: true }}
          icon={Target}
          description="Meta: > 3:1"
        />
        <MetricCard
          title="Payback Period"
          value="6.8 meses"
          change={{ value: 1.2, isPositive: true }}
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ltvCacTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v / 1000}k`} />
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
          </CardContent>
        </Card>

        {/* CAC by Channel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CAC por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cacByChannelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v / 1000}k`} />
                  <YAxis dataKey="channel" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'CAC']}
                  />
                  <Bar dataKey="cac" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* CAC Components */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Componentes do CAC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cacComponentsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                  >
                    {cacComponentsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {cacComponentsData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span>{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
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
                    {simulatedLTV > baseLTV ? "+" : ""}{((simulatedLTV - baseLTV) / baseLTV * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg bg-background p-4 text-center">
                  <p className="text-sm text-muted-foreground">Novo CAC</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(simulatedCAC)}</p>
                  <p className="text-xs text-muted-foreground">
                    {simulatedCAC < baseCAC ? "-" : "+"}{Math.abs((simulatedCAC - baseCAC) / baseCAC * 100).toFixed(1)}%
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
