import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useFixedCosts } from "@/hooks/useFixedCosts";
import { useVariableCosts } from "@/hooks/useVariableCosts";

interface DRELine {
  label: string;
  actual: number;
  budgeted: number;
  isHeader?: boolean;
  isTotal?: boolean;
  indent?: number;
}

export default function Dre() {
  const { data: metrics, isLoading: isLoadingMetrics } = useDashboardData();
  const { data: fixedCosts, isLoading: isLoadingFixed } = useFixedCosts();
  const { data: variableCosts, isLoading: isLoadingVariable } = useVariableCosts();

  if (isLoadingMetrics || isLoadingFixed || isLoadingVariable) {
    return (
      <AppLayout title="DRE" subtitle="Demonstrativo de Resultado do Exercício">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Get latest month data
  const currentMetric = metrics?.[metrics.length - 1] || { revenue: 0, mrr: 0, expenses: 0 };

  // Totals
  const totalFixed = fixedCosts?.reduce((acc, c) => acc + c.actual, 0) || 0;
  const totalVariable = variableCosts?.reduce((acc, c) => acc + c.amount, 0) || 0;

  // Calculate DRE items
  const receitaBruta = currentMetric.revenue || currentMetric.mrr; // Fallback to MRR if revenue empty
  const impostos = receitaBruta * 0.08; // Est. Tax 8%
  const receitaLiquida = receitaBruta - impostos;
  const margemContribuicao = receitaLiquida - totalVariable;
  const ebitda = margemContribuicao - totalFixed;
  const depAmort = 2500; // Static estimate
  const ebit = ebitda - depAmort;
  const resFinanceiro = -350; // Static estimate
  const lucroAntesIR = ebit + resFinanceiro;
  const irCsll = lucroAntesIR > 0 ? lucroAntesIR * 0.15 : 0;
  const lucroLiquido = lucroAntesIR - irCsll;

  const dreData: DRELine[] = [
    { label: "RECEITA BRUTA", actual: receitaBruta, budgeted: receitaBruta * 1.05, isHeader: true },
    { label: "MRR Total", actual: currentMetric.mrr, budgeted: currentMetric.mrr * 1.02, indent: 1 },
    { label: "Serviços/Extras", actual: receitaBruta - currentMetric.mrr, budgeted: 5000, indent: 1 },

    { label: "(-) DEDUÇÕES", actual: -impostos, budgeted: -(receitaBruta * 1.05 * 0.08), isHeader: true },
    { label: "Impostos sobre Receita", actual: -impostos, budgeted: -(receitaBruta * 1.05 * 0.08), indent: 1 },

    { label: "= RECEITA LÍQUIDA", actual: receitaLiquida, budgeted: receitaLiquida * 1.05, isTotal: true },

    { label: "(-) CUSTOS VARIÁVEIS", actual: -totalVariable, budgeted: -totalVariable * 0.95, isHeader: true },
    // We could list variable categories here by mapping variableCosts
    ...(variableCosts?.map(vc => ({
      label: vc.category,
      actual: -vc.amount,
      budgeted: -vc.amount * 0.9,
      indent: 1
    })) || []),

    { label: "= MARGEM DE CONTRIBUIÇÃO", actual: margemContribuicao, budgeted: margemContribuicao * 1.05, isTotal: true },

    { label: "(-) CUSTOS FIXOS", actual: -totalFixed, budgeted: -totalFixed * 0.98, isHeader: true },
    // We could list fixed categories here
    ...(fixedCosts?.map(fc => ({
      label: fc.category,
      actual: -fc.actual,
      budgeted: -fc.budgeted,
      indent: 1
    })) || []),

    { label: "= EBITDA", actual: ebitda, budgeted: ebitda * 1.1, isTotal: true },

    { label: "(-) Depreciação", actual: -depAmort, budgeted: -depAmort, indent: 1 },

    { label: "= EBIT", actual: ebit, budgeted: ebit * 1.1, isTotal: true },

    { label: "Resultado Financeiro", actual: resFinanceiro, budgeted: resFinanceiro, indent: 1 },

    { label: "= RESULTADO ANTES IR", actual: lucroAntesIR, budgeted: lucroAntesIR * 1.1, isTotal: true },

    { label: "(-) IR/CSLL", actual: -irCsll, budgeted: -irCsll * 1.1, indent: 1 },

    { label: "= LUCRO LÍQUIDO", actual: lucroLiquido, budgeted: lucroLiquido * 1.1, isTotal: true },
  ];

  // Simplified chart data - reusing aggregates for mock history if needed or actual if available ??
  // We can map metrics to monthlyComparison if metrics has historical data
  const monthlyComparison = metrics?.slice(-6).map(m => {
    // We need historical costs. Assuming fixed/variable costs are roughly relative to MRR or constant for MVP trend
    // This is an approximation since we don't have historical cost tables
    const r = m.revenue || m.mrr;
    const estCosts = r * 0.7; // Mock cost history
    return {
      month: new Date(m.month + '-02').toLocaleString('default', { month: 'short' }),
      receita: r,
      custos: estCosts,
      ebitda: r - estCosts
    };
  }) || [];

  const margemBruta = receitaLiquida ? ((margemContribuicao / receitaLiquida) * 100).toFixed(1) : "0.0";
  const margemEbitda = receitaLiquida ? ((ebitda / receitaLiquida) * 100).toFixed(1) : "0.0";
  const margemLiquida = receitaLiquida ? ((lucroLiquido / receitaLiquida) * 100).toFixed(1) : "0.0";

  return (
    <AppLayout
      title="DRE"
      subtitle="Demonstrativo de Resultado do Exercício"
    >
      {/* Actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Tabs defaultValue="mensal" className="w-auto">
          <TabsList>
            <TabsTrigger value="mensal">Mensal</TabsTrigger>
            <TabsTrigger value="trimestral">Trimestral</TabsTrigger>
            <TabsTrigger value="anual">Anual</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Receita Líquida</p>
            <p className="text-2xl font-bold">{formatCurrency(receitaLiquida)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Margem Bruta</p>
            <p className="text-2xl font-bold text-success">{margemBruta}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Margem EBITDA</p>
            <p className="text-2xl font-bold text-primary">{margemEbitda}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Margem Líquida</p>
            <p className="text-2xl font-bold text-primary">{margemLiquida}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* DRE Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Janeiro 2024</span>
              <Badge variant="outline">Comparativo: Realizado vs Orçado</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 text-left text-sm font-medium text-muted-foreground">Descrição</th>
                    <th className="py-3 text-right text-sm font-medium text-muted-foreground">Realizado</th>
                    <th className="py-3 text-right text-sm font-medium text-muted-foreground">Orçado</th>
                    <th className="py-3 text-right text-sm font-medium text-muted-foreground">Var. %</th>
                    <th className="py-3 text-right text-sm font-medium text-muted-foreground">AV %</th>
                  </tr>
                </thead>
                <tbody>
                  {dreData.map((row, idx) => {
                    const variance = row.budgeted !== 0 ? ((row.actual - row.budgeted) / Math.abs(row.budgeted)) * 100 : 0;
                    const isPositive = row.actual >= 0 ? variance > 0 : variance < 0;
                    const verticalAnalysis = receitaLiquida !== 0 ? (row.actual / receitaLiquida) * 100 : 0;

                    return (
                      <tr
                        key={idx}
                        className={cn(
                          "border-b border-border/50",
                          row.isHeader && "bg-muted/30",
                          row.isTotal && "bg-primary/5 font-semibold"
                        )}
                      >
                        <td
                          className={cn(
                            "py-2 text-sm",
                            row.indent && `pl-${row.indent * 4}`,
                            row.isHeader && "font-semibold",
                            row.isTotal && "font-bold"
                          )}
                          style={{ paddingLeft: row.indent ? `${row.indent * 16}px` : undefined }}
                        >
                          {row.label}
                        </td>
                        <td className={cn(
                          "py-2 text-right text-sm tabular-nums",
                          row.actual < 0 && "text-destructive",
                          row.isTotal && "font-bold"
                        )}>
                          {formatCurrency(row.actual)}
                        </td>
                        <td className="py-2 text-right text-sm text-muted-foreground tabular-nums">
                          {formatCurrency(row.budgeted)}
                        </td>
                        <td className="py-2 text-right text-sm">
                          <span className={cn(
                            "inline-flex items-center gap-1",
                            isPositive ? "text-success" : "text-destructive"
                          )}>
                            {variance !== 0 && (
                              isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
                            )}
                            {variance === 0 ? <Minus className="h-3 w-3" /> : null}
                            {Math.abs(variance).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 text-right text-sm text-muted-foreground tabular-nums">
                          {row.isTotal || row.isHeader ? `${Math.abs(verticalAnalysis).toFixed(1)}%` : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Legend />
                  <Bar dataKey="receita" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="custos" name="Custos" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ebitda" name="EBITDA" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
