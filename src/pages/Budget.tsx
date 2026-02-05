import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Plus, Target, TrendingUp, AlertCircle, Loader2, Wallet } from "lucide-react";
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
import { useFixedCosts } from "@/hooks/useFixedCosts";
import { useDashboardData } from "@/hooks/useDashboardData";

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
  const { data: fixedCosts, isLoading: isLoadingCosts } = useFixedCosts();
  const { data: metrics, isLoading: isLoadingMetrics } = useDashboardData();

  if (isLoadingCosts || isLoadingMetrics) {
    return (
      <AppLayout title="Orçamento" subtitle="Gestão de metas e budget anual">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Calculate generic revenue stats from metrics
  const currentMonthMetrics = metrics?.[metrics.length - 1];
  const revenueBudgeted = 350000; // This would typically come from a budget goals table
  const revenueActual = currentMonthMetrics?.revenue || 0;

  // Aggregate costs
  const totalBudgetedCosts = fixedCosts?.reduce((acc, cost) => acc + cost.budgeted, 0) || 0;
  const totalActualCosts = fixedCosts?.reduce((acc, cost) => acc + cost.actual, 0) || 0;

  const budgetData = [
    { category: "Receita", budgeted: revenueBudgeted, actual: revenueActual },
    { category: "Despesas", budgeted: totalBudgetedCosts, actual: totalActualCosts },
    // Detailed categories
    ...(fixedCosts?.map(c => ({
      category: c.category,
      budgeted: c.budgeted,
      actual: c.actual
    })) || [])
  ];

  return (
    <AppLayout
      title="Orçamento"
      subtitle="Gestão de metas e budget anual"
    >
      {/* Actions Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Orçamento Anual"
          value={formatCurrency(revenueBudgeted * 12)}
          change={{ value: 0, isPositive: true }}
          icon={Target}
          description="Meta de Receita"
        />
        <MetricCard
          title="Realizado (YTD)"
          value={formatCurrency(revenueActual * 7)} // Mock YTD
          change={{ value: 2.5, isPositive: true }}
          icon={TrendingUp}
          description="98% da meta"
        />
        <MetricCard
          title="Desvio Global"
          value="+1.2%"
          change={{ value: 1.2, isPositive: false }}
          icon={AlertCircle}
          description="Acima do orçado"
        />
        <MetricCard
          title="Budget Disponível"
          value={formatCurrency(54000)}
          change={{ value: 0, isPositive: true }}
          icon={Wallet}
          description="Q3 2024"
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
    </AppLayout>
  );
}

