import { useMemo } from "react";
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
import { useFixedCosts } from "@/hooks/useFixedCosts";
import { formatCurrency } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

// Mock upcoming payments - typically would come from a payments/bills table
const upcomingPayments = [
  { name: "Folha de Pagamento", amount: 110000, date: "05/01", status: "upcoming" },
  { name: "Aluguel", amount: 8500, date: "05/01", status: "upcoming" },
  { name: "Contabilidade", amount: 2500, date: "10/01", status: "upcoming" },
  { name: "Internet + Telefonia", amount: 1200, date: "15/01", status: "upcoming" },
  { name: "Simples Nacional", amount: 32000, date: "20/01", status: "upcoming" },
];

export default function FixedCosts() {
  const { data: costs, isLoading } = useFixedCosts();

  const {
    totalActual,
    personnelCost,
    infrastructureCost,
    operationalCost,
    personnelPercent,
    infraPercent,
    operationalPercent,
    comparisonData
  } = useMemo(() => {
    if (!costs) return {
      totalActual: 0,
      personnelCost: 0,
      infrastructureCost: 0,
      operationalCost: 0,
      personnelPercent: 0,
      infraPercent: 0,
      operationalPercent: 0,
      comparisonData: []
    };

    const tActual = costs.reduce((acc, c) => acc + c.actual, 0);

    const pCost = costs.filter(c => c.category === 'Pessoal').reduce((acc, c) => acc + c.actual, 0);
    const iCost = costs.filter(c => c.category === 'Infraestrutura').reduce((acc, c) => acc + c.actual, 0);
    const oCost = costs.filter(c => c.category === 'Operacional').reduce((acc, c) => acc + c.actual, 0);

    const pPercent = tActual ? (pCost / tActual) * 100 : 0;
    const iPercent = tActual ? (iCost / tActual) * 100 : 0;
    const oPercent = tActual ? (oCost / tActual) * 100 : 0;

    // Use current month actuals mixed with mock history
    const compData = [
      { month: "Jul", budgeted: 245000, actual: 242000 },
      { month: "Ago", budgeted: 248000, actual: 251000 },
      { month: "Set", budgeted: 250000, actual: 248500 },
      { month: "Out", budgeted: 252000, actual: 254000 },
      { month: "Nov", budgeted: 255000, actual: 253000 },
      { month: "Dez", budgeted: 258000, actual: 260000 },
      { month: "Jan", budgeted: 260000, actual: tActual },
    ];

    return {
      totalActual: tActual,
      personnelCost: pCost,
      infrastructureCost: iCost,
      operationalCost: oCost,
      personnelPercent: pPercent,
      infraPercent: iPercent,
      operationalPercent: oPercent,
      comparisonData: compData
    };
  }, [costs]);

  if (isLoading) {
    return (
      <AppLayout title="Custos Fixos" subtitle="Gestão de despesas recorrentes e provisionamentos">
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
          <Skeleton className="h-[300px] w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Custos Fixos"
      subtitle="Gestão de despesas recorrentes e provisionamentos"
    >
      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Custos Fixos"
          value={formatCurrency(totalActual)}
          change={{ value: 1.2, isPositive: false }}
          icon={Building2}
          description="Este mês"
        />
        <MetricCard
          title="Pessoal"
          value={formatCurrency(personnelCost)}
          change={{ value: 0, isPositive: true }}
          icon={Users}
          description={`${personnelPercent.toFixed(1)}% do total`}
        />
        <MetricCard
          title="Infraestrutura"
          value={formatCurrency(infrastructureCost)}
          change={{ value: 0, isPositive: true }}
          icon={Server}
          description={`${infraPercent.toFixed(1)}% do total`}
        />
        <MetricCard
          title="Operacional"
          value={formatCurrency(operationalCost)}
          change={{ value: 2.1, isPositive: false }}
          icon={Briefcase}
          description={`${operationalPercent.toFixed(1)}% do total`}
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
