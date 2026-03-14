import React from "react";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Target, TrendingUp, AlertCircle, Loader2, Wallet } from "lucide-react";
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
import { useFinancialSnapshot } from "@/hooks/useFinancialMetrics";
import { CreateBudgetModal } from "@/components/modals/CreateBudgetModal";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Keeping OKRs static for now as per schema prioritization
const okrs = [
  {
    objective: "Atingir R$ 500k MRR",
    keyResults: [
      { kr: "Aumentar base de clientes para 200", progress: 85, target: "200 clientes" },
      { kr: "Reduzir churn para < 2%", progress: 60, target: "2%" },
    ],
  },
  {
    objective: "Otimizar Margem Operacional",
    keyResults: [
      { kr: "Reduzir custos de cloud em 15%", progress: 45, target: "15%" },
      { kr: "Automatizar processos de cobrança", progress: 90, target: "100%" },
    ],
  },
];

export default function Budget() {
  const { setPageTitle } = usePageTitle();
  const { fixedCosts, isLoading: isLoadingCosts } = useFinancialData();
  const { current, isLoading: isLoadingMetrics } = useFinancialSnapshot();

  React.useEffect(() => {
    setPageTitle("Orçamento", "Gestão de metas e budget anual");
  }, [setPageTitle]);

  if (isLoadingCosts || isLoadingMetrics || !current) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate generic revenue stats from current snapshot
  const revenueBudgeted = 350000; // This would typically come from a budget goals table
  const revenueActual = current.revenue || 0;

  // Aggregate costs - Filter by selected month? 
  // Budget usually compares Annual or Monthly. 
  // Let's assume the view is Monthly for now to match other pages.
  // Note: fixedCosts from context are ALL fixed costs. We should filter by month ideally or assumes they are templates.
  // In Dre.tsx we filtered by month. Let's do same here for consistency.
  // If `fixedCosts` in context are just the list of cost items (that recur), we sum them up.
  // But wait, in Dre.tsx we did `fixedCosts.filter(c => c.month === selectedMonthStr)`.
  // So they are monthly instances. We should filter.
  // But wait, here we don't have `selectedMonth` easily accessible unless we grab it from context.

  // Actually we need selectedMonth from context to filter costs correctly.

  // Ideally, totalActualCosts should match what we see in DRE for Fixed Costs.
  // Does current.totalExpenses include fixed costs? Yes.
  // But we want to break it down.
  // Let's just use current.totalExpenses for simplicity?
  // No, the chart breaks down by category.

  // Let's assume we want to show the breakdown of the CURRENT month's budget.
  // We need to import selectedMonth from context.

  const { selectedMonth } = useFinancialData(); // get selectedMonth

  // Filter costs for current month (naive implementation assuming standard date format in db)
  // Or we can rely on what useFinancialSnapshot calculated? No, that returns totals.

  // Let's rely on the fact that fixedCosts in DB has a 'month' column as seen in Dre.tsx
  const currentMonthStr = selectedMonth.toISOString().slice(0, 7); // YYYY-MM

  const currentFixedCosts = fixedCosts.filter(c => c.month && c.month.startsWith(currentMonthStr));

  const totalBudgetedCosts = currentFixedCosts.reduce((acc, cost) => acc + (cost.budgeted || 0), 0) || 0;
  const totalActualCosts = currentFixedCosts.reduce((acc, cost) => acc + cost.actual, 0) || 0;

  const budgetData = [
    { category: "Receita", budgeted: revenueBudgeted, actual: revenueActual },
    { category: "Despesas", budgeted: totalBudgetedCosts, actual: totalActualCosts },
    // Detailed categories
    ...currentFixedCosts.map(c => ({
      category: c.category,
      budgeted: c.budgeted || 0,
      actual: c.actual
    }))
  ];

  return (
    <>
      {/* Actions Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
        <CreateBudgetModal />
      </div>

      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Orçamento Anual"
          value={formatCurrency(revenueBudgeted * 12)}
          change={0}
          icon={Target}
          description="Meta de Receita"
        />
        <MetricCard
          title="Realizado (Mês)"
          value={formatCurrency(revenueActual)}
          change={0}
          icon={TrendingUp}
          description="Receita deste mês"
        />
        <MetricCard
          title="Desvio Global"
          value={((revenueActual - revenueBudgeted) / revenueBudgeted * 100).toFixed(1) + "%"}
          change={0}
          icon={AlertCircle}
          description="vs Orçado"
        />
        <MetricCard
          title="Budget Disponível"
          value={formatCurrency(revenueBudgeted - revenueActual)}
          change={0}
          icon={Wallet}
          description="Restante"
        />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* Budget vs Actual Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Orçado vs Realizado (Mês Atual)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tickFormatter={(v) => `R$ ${v / 1000}k`} />
                  <YAxis dataKey="category" type="category" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Legend />
                  <Bar dataKey="budgeted" name="Orçado" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="actual" name="Realizado" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* OKRs Status */}
        <div className="space-y-6">
          {okrs.map((okr, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">
                  OKR: {okr.objective}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {okr.keyResults.map((kr, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{kr.kr}</span>
                      <span className="text-muted-foreground">{kr.target}</span>
                    </div>
                    <Progress value={kr.progress} className="h-2" />
                    <p className="text-right text-xs text-muted-foreground">
                      {kr.progress}% atingido
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
