import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { VariableCostsTable } from "@/components/costs/VariableCostsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Percent, Users, AlertTriangle } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useVariableCosts } from "@/hooks/useVariableCosts";
import { formatCurrency } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateVariableCostModal } from "@/components/modals/CreateVariableCostModal";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function VariableCosts() {
  const { data: costs, isLoading } = useVariableCosts();

  const { totalVariableCosts, categoryData } = useMemo(() => {
    if (!costs) return { totalVariableCosts: 0, categoryData: [] };

    const total = costs.reduce((acc, c) => acc + c.amount, 0);
    const catData = costs.map((c, index) => ({
      name: c.category,
      value: c.amount,
      color: COLORS[index % COLORS.length]
    }));

    return { totalVariableCosts: total, categoryData: catData };
  }, [costs]);

  if (isLoading) {
    return (
      <AppLayout title="Custos Variáveis" subtitle="Gestão de custos proporcionais ao uso e consumo">
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
          <Skeleton className="h-[200px] w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Custos Variáveis"
      subtitle="Gestão de custos proporcionais ao uso e consumo"
    >
      <div className="mb-6 flex justify-end">
        <CreateVariableCostModal />
      </div>

      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Custos Variáveis"
          value={formatCurrency(totalVariableCosts)}
          change={0}
          icon={TrendingDown}
          description="Este mês"
        />
        <MetricCard
          title="Margem de Contribuição"
          value="N/A"
          change={0}
          icon={Percent}
          description="Dados insuficientes"
        />
        <MetricCard
          title="Custo Médio por Cliente"
          value="N/A"
          change={0}
          icon={Users}
          description="Dados insuficientes"
        />
        <MetricCard
          title="Alertas Ativos"
          value="0"
          change={0}
          icon={AlertTriangle}
          description="Nenhum alerta"
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* Monthly Trend - REMOVED MOCK */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Evolução por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              Sem histórico de custos variáveis.
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
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
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
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Sem dados.
                </div>
              )}
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
