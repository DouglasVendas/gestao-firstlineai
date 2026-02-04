import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { FixedCostsCategories } from "@/components/costs/FixedCostsCategories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Server, Briefcase, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";

const comparisonData = [
  { month: "Jul", budgeted: 245000, actual: 242000 },
  { month: "Ago", budgeted: 248000, actual: 251000 },
  { month: "Set", budgeted: 250000, actual: 248500 },
  { month: "Out", budgeted: 252000, actual: 254000 },
  { month: "Nov", budgeted: 255000, actual: 253000 },
  { month: "Dez", budgeted: 258000, actual: 260000 },
  { month: "Jan", budgeted: 260000, actual: 257800 },
];

const upcomingPayments = [
  { name: "Folha de Pagamento", amount: 110000, date: "05/01", status: "upcoming" },
  { name: "Aluguel", amount: 8500, date: "05/01", status: "upcoming" },
  { name: "Contabilidade", amount: 2500, date: "10/01", status: "upcoming" },
  { name: "Internet + Telefonia", amount: 1200, date: "15/01", status: "upcoming" },
  { name: "Simples Nacional", amount: 32000, date: "20/01", status: "upcoming" },
];

export default function FixedCosts() {
  return (
    <AppLayout
      title="Custos Fixos"
      subtitle="Gestão de despesas recorrentes e provisionamentos"
    >
      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Custos Fixos"
          value="R$ 257.800"
          change={{ value: 1.2, isPositive: false }}
          icon={Building2}
          description="Este mês"
        />
        <MetricCard
          title="Pessoal"
          value="R$ 168.800"
          change={{ value: 0, isPositive: true }}
          icon={Users}
          description="65.5% do total"
        />
        <MetricCard
          title="Infraestrutura"
          value="R$ 10.500"
          change={{ value: 0, isPositive: true }}
          icon={Server}
          description="4.1% do total"
        />
        <MetricCard
          title="Operacional"
          value="R$ 78.500"
          change={{ value: 2.1, isPositive: false }}
          icon={Briefcase}
          description="30.4% do total"
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* Budget vs Actual Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Orçado vs Realizado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} barGap={0}>
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
                  <Legend />
                  <Bar dataKey="budgeted" name="Orçado" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Realizado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Próximos Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingPayments.map((payment, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{payment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Vence em {payment.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      R$ {payment.amount.toLocaleString()}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      Agendado
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Categorias de Custos Fixos</CardTitle>
        </CardHeader>
        <CardContent>
          <FixedCostsCategories />
        </CardContent>
      </Card>
    </AppLayout>
  );
}
