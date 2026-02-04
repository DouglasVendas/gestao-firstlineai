import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { VariableCostsTable } from "@/components/costs/VariableCostsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Percent, Users, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const monthlyData = [
  { month: "Jul", apis: 18500, cloud: 18200, gateway: 9800 },
  { month: "Ago", apis: 19200, cloud: 18800, gateway: 10200 },
  { month: "Set", apis: 20100, cloud: 19500, gateway: 10500 },
  { month: "Out", apis: 21500, cloud: 20100, gateway: 10800 },
  { month: "Nov", apis: 22300, cloud: 20400, gateway: 11000 },
  { month: "Dez", apis: 22800, cloud: 20600, gateway: 11200 },
  { month: "Jan", apis: 23000, cloud: 20700, gateway: 11500 },
];

const categoryData = [
  { name: "APIs de IA", value: 23000, color: "hsl(var(--chart-1))" },
  { name: "Cloud", value: 20700, color: "hsl(var(--chart-2))" },
  { name: "Gateway", value: 11500, color: "hsl(var(--chart-3))" },
];

const alerts = [
  { client: "Tech Solutions", service: "Anthropic", increase: 45, message: "Consumo 45% acima da média" },
  { client: "Digital Corp", service: "AWS", increase: 28, message: "Pico de storage detectado" },
];

export default function VariableCosts() {
  return (
    <AppLayout
      title="Custos Variáveis"
      subtitle="Gestão de custos proporcionais ao uso e consumo"
    >
      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Custos Variáveis"
          value="R$ 55.200"
          change={{ value: 4.5, isPositive: false }}
          icon={TrendingDown}
          description="Este mês"
        />
        <MetricCard
          title="Margem de Contribuição"
          value="82.5%"
          change={{ value: 1.2, isPositive: true }}
          icon={Percent}
          description="Receita - Custos Var."
        />
        <MetricCard
          title="Custo Médio por Cliente"
          value="R$ 552"
          change={{ value: 2.1, isPositive: false }}
          icon={Users}
          description="100 clientes ativos"
        />
        <MetricCard
          title="Alertas Ativos"
          value="2"
          change={{ value: 1, isPositive: false }}
          icon={AlertTriangle}
          description="Consumo anômalo"
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="mb-6 border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-warning">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Consumo Anômalo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-background/50 p-3"
                >
                  <div>
                    <span className="font-medium">{alert.client}</span>
                    <span className="mx-2 text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{alert.service}</span>
                  </div>
                  <span className="text-sm text-warning">{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* Monthly Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Evolução por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString()}`, '']}
                  />
                  <Bar dataKey="apis" name="APIs de IA" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cloud" name="Cloud" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gateway" name="Gateway" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString()}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                  </div>
                  <span className="font-medium">R$ {cat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Costs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento de Custos</CardTitle>
        </CardHeader>
        <CardContent>
          <VariableCostsTable />
        </CardContent>
      </Card>
    </AppLayout>
  );
}
