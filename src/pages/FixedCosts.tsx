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
import { CreateFixedCostModal } from "@/components/modals/CreateFixedCostModal";

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

    // Only show current month based on actual data present
    const compData: any[] = [];
    if (tActual > 0) {
      compData.push({ month: "Atual", budgeted: 0, actual: tActual });
    }

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
      <div className="mb-6 flex justify-end">
        <CreateFixedCostModal />
      </div>

      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Custos Fixos"
          value={formatCurrency(totalActual)}
          change={0}
          icon={Building2}
          description="Este mês"
        />
        <MetricCard
          title="Pessoal"
          value={formatCurrency(personnelCost)}
          change={0}
          icon={Users}
          description={`${personnelPercent.toFixed(1)}% do total`}
        />
        <MetricCard
          title="Infraestrutura"
          value={formatCurrency(infrastructureCost)}
          change={0}
          icon={Server}
          description={`${infraPercent.toFixed(1)}% do total`}
        />
        <MetricCard
          title="Operacional"
          value={formatCurrency(operationalCost)}
          change={0}
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
              {comparisonData.length > 0 ? (
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
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Sem dados suficientes.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments - REMOVED MOCK */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Próximos Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-center text-sm text-muted-foreground p-4">
              Use a Importação para adicionar contas a pagar.
              <br />
              (Tabela de Pagamentos Futuros ainda não vinculada)
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
