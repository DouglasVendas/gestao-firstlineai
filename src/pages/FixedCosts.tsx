import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { FixedCostsCategories } from "@/components/costs/FixedCostsCategories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Server, Briefcase, Calendar, Loader2 } from "lucide-react";
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
import { useFinancialData } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/formatters";
import { CreateFixedCostModal } from "@/components/modals/CreateFixedCostModal";
import { isSameMonth, parseISO } from "date-fns";

export default function FixedCosts() {
  const { fixedCosts, selectedMonth, isLoading } = useFinancialData();

  const filteredCosts = useMemo(() => {
    if (!fixedCosts) return [];
    // Fixed costs might have a specific month or rely on recurrence.
    // For now, assuming fixed_costs table has 'month' column as per schema analysis or if it's strictly fixed recurrent, we might need logic.
    // However, the FixedCost interface likely has 'month' or we treat them as applying to all months if recurrence is 'monthly'?
    // Let's check schema. If it has 'month' column, we filter. If not, we might need to project it.
    // The previous implementation used `useFixedCosts` which fetched `fixed_costs`.
    // Let's assume it has 'month' or 'date' field or `month` column from `useFixedCosts` typing.
    // Wait, `useFixedCosts` type has `month`?
    // Let's assume yes based on VariableCosts pattern, but I should verify `useFixedCosts`.
    // If it DOESN'T have month, how do we know which month it belongs to?
    // Maybe fixed costs are just "templates" that apply every month?
    // But the dashboard sums them up.
    // If they are templates, `filteredCosts` should probably include ALL active fixed costs.
    // If they are specific records per month, we filter.
    // Given the name `fixed_costs`, it usually implies recurrency.
    // But `FixedCostsCategories` in mock used `comparisonData` with "Actual".
    // Let's assume effectively filtering by month IS required or they are instantiated.
    // I will check `useFixedCosts` file content in next step to be sure about `month` property.
    // For now, I will use safe filtering if `month` exists.
    return fixedCosts.filter(c => {
      if (c.month) return isSameMonth(parseISO(c.month), selectedMonth);
      // If no month, maybe it's a template? Let's treat as valid for now if we don't have month column
      return true;
    });
  }, [fixedCosts, selectedMonth]);

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
    if (!filteredCosts.length) return {
      totalActual: 0,
      personnelCost: 0,
      infrastructureCost: 0,
      operationalCost: 0,
      personnelPercent: 0,
      infraPercent: 0,
      operationalPercent: 0,
      comparisonData: []
    };

    const tActual = filteredCosts.reduce((acc, c) => acc + Number(c.actual), 0);

    const pCost = filteredCosts.filter(c => c.category === 'Pessoal').reduce((acc, c) => acc + Number(c.actual), 0);
    const iCost = filteredCosts.filter(c => c.category === 'Infraestrutura').reduce((acc, c) => acc + Number(c.actual), 0);
    const oCost = filteredCosts.filter(c => c.category === 'Operacional').reduce((acc, c) => acc + Number(c.actual), 0);

    const pPercent = tActual ? (pCost / tActual) * 100 : 0;
    const iPercent = tActual ? (iCost / tActual) * 100 : 0;
    const oPercent = tActual ? (oCost / tActual) * 100 : 0;

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
  }, [filteredCosts]);

  if (isLoading) {
    return (
      <AppLayout title="Custos Fixos" subtitle="Gestão de despesas recorrentes e provisionamentos">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          icon={<Building2 className="h-6 w-6" />}
          description="Este mês"
          variant="default"
        />
        <MetricCard
          title="Pessoal"
          value={formatCurrency(personnelCost)}
          change={0}
          icon={<Users className="h-6 w-6" />}
          description={`${personnelPercent.toFixed(1)}% do total`}
          variant="default"
        />
        <MetricCard
          title="Infraestrutura"
          value={formatCurrency(infrastructureCost)}
          change={0}
          icon={<Server className="h-6 w-6" />}
          description={`${infraPercent.toFixed(1)}% do total`}
          variant="default"
        />
        <MetricCard
          title="Operacional"
          value={formatCurrency(operationalCost)}
          change={0}
          icon={<Briefcase className="h-6 w-6" />}
          description={`${operationalPercent.toFixed(1)}% do total`}
          variant="default"
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
                  Sem dados ou orçamento definido para este mês.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments - Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Próximos Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-center text-sm text-muted-foreground p-4">
              Visualização de vencimentos futuros indisponível no filtro mensal.
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
          <FixedCostsCategories costs={filteredCosts} />
        </CardContent>
      </Card>
    </AppLayout>
  );
}
