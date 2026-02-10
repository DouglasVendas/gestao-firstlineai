import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, TrendingUp, TrendingDown, Minus, Loader2, Calendar as CalendarIcon, Filter } from "lucide-react";
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
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useFinancials } from "@/hooks/useFinancials";
import { useFixedCosts } from "@/hooks/useFixedCosts";
import { useVariableCosts } from "@/hooks/useVariableCosts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { format, parseISO, startOfMonth } from "date-fns";

interface DRELine {
  label: string;
  actual: number;
  budgeted: number;
  isHeader?: boolean;
  isTotal?: boolean;
  indent?: number;
}

export default function Dre() {
  const { data: financials, isLoading: isLoadingMetrics } = useFinancials();
  const { data: fixedCosts, isLoading: isLoadingFixed } = useFixedCosts();
  const { data: variableCosts, isLoading: isLoadingVariable } = useVariableCosts();

  const [date, setDate] = useState<Date>(new Date()); // Default to current date

  const selectedMonthStr = useMemo(() => {
    return format(date, 'yyyy-MM');
  }, [date]);

  // Filter data for the selected month
  const currentMetric = useMemo(() => {
    return financials?.find(m => m.month === selectedMonthStr) || { revenue: 0, mrr: 0, expenses: 0 };
  }, [financials, selectedMonthStr]);

  const currentFixedCosts = useMemo(() => {
    if (!fixedCosts) return [];
    return fixedCosts.filter(c => c.month === selectedMonthStr || (c.month && c.month.substring(0, 7) === selectedMonthStr));
  }, [fixedCosts, selectedMonthStr]);

  const currentVariableCosts = useMemo(() => {
    if (!variableCosts) return [];
    return variableCosts.filter(c => c.month === selectedMonthStr || (c.month && c.month.substring(0, 7) === selectedMonthStr));
  }, [variableCosts, selectedMonthStr]);


  if (isLoadingMetrics || isLoadingFixed || isLoadingVariable) {
    return (
      <AppLayout title="DRE" subtitle="Demonstrativo de Resultado do Exercício">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Totals
  const totalFixed = currentFixedCosts.reduce((acc, c) => acc + c.actual, 0);

  // Calculate DRE items
  const receitaBruta = currentMetric.revenue || currentMetric.mrr || 0;

  const impostosReais = currentVariableCosts
    .filter(c => ['Impostos', 'DARF', 'Simples Nacional', 'Taxas'].includes(c.category) || c.category.toUpperCase().includes('DARF') || c.category.toUpperCase().includes('SIMPLES'))
    .reduce((acc, c) => acc + c.amount, 0);

  const impostos = impostosReais;

  const receitaLiquida = receitaBruta - impostos;

  // Total Variable excluding Taxes (since we deducted above)
  const totalVariable = currentVariableCosts
    .filter(c => !['Impostos', 'DARF', 'Simples Nacional', 'Taxas'].includes(c.category) && !c.category.toUpperCase().includes('DARF') && !c.category.toUpperCase().includes('SIMPLES'))
    .reduce((acc, c) => acc + c.amount, 0);

  const margemContribuicao = receitaLiquida - totalVariable;
  const ebitda = margemContribuicao - totalFixed;
  const depAmort = 0; // No real data for this yet, assuming 0/clean for now or we could add a manual entry. User wants REAL data.
  const ebit = ebitda - depAmort;
  const resFinanceiro = 0; // Same as above
  const lucroAntesIR = ebit + resFinanceiro;
  const irCsll = 0; // If Simples, usually included in taxes above. If lucro real/presumido, separate. Assuming Simples for now based on data.
  const lucroLiquido = lucroAntesIR - irCsll;

  const dreData: DRELine[] = [
    { label: "RECEITA BRUTA", actual: receitaBruta, budgeted: 0, isHeader: true }, // Budgeted 0 for now as we cleaned budget
    { label: "Receita de Vendas/Serviços", actual: receitaBruta, budgeted: 0, indent: 1 },

    { label: "(-) DEDUÇÕES (Impostos)", actual: -impostos, budgeted: 0, isHeader: true },

    { label: "= RECEITA LÍQUIDA", actual: receitaLiquida, budgeted: 0, isTotal: true },

    { label: "(-) CUSTOS VARIÁVEIS", actual: -totalVariable, budgeted: 0, isHeader: true },
    ...(currentVariableCosts
      .filter(c => !['Impostos', 'DARF', 'Simples Nacional', 'Taxas'].includes(c.category) && !c.category.toUpperCase().includes('DARF'))
      .map(vc => ({
        label: vc.category,
        actual: -vc.amount,
        budgeted: 0,
        indent: 1
      })) || []),

    { label: "= MARGEM DE CONTRIBUIÇÃO", actual: margemContribuicao, budgeted: 0, isTotal: true },

    { label: "(-) CUSTOS FIXOS", actual: -totalFixed, budgeted: 0, isHeader: true },
    ...(currentFixedCosts.map(fc => ({
      label: fc.category,
      actual: -fc.actual,
      budgeted: -fc.budgeted || 0,
      indent: 1
    })) || []),

    { label: "= EBITDA", actual: ebitda, budgeted: 0, isTotal: true },

    { label: "(-) Depreciação/Amortização", actual: -depAmort, budgeted: 0, indent: 1 },

    { label: "= EBIT", actual: ebit, budgeted: 0, isTotal: true },

    { label: "Resultado Financeiro", actual: resFinanceiro, budgeted: 0, indent: 1 },

    { label: "= RESULTADO ANTES IR", actual: lucroAntesIR, budgeted: 0, isTotal: true },

    { label: "(-) IR/CSLL", actual: -irCsll, budgeted: 0, indent: 1 },

    { label: "= LUCRO LÍQUIDO", actual: lucroLiquido, budgeted: 0, isTotal: true },
  ];

  // Chart Data - Evolution of last 6 months or year to date?
  // Use financials history
  const monthlyComparison = financials?.slice(-6).map(m => {
    const r = m.revenue || 0;
    const exp = m.expenses || 0; // Total expenses from metrics
    return {
      month: typeof m.month === 'string' && m.month.length >= 7 ? format(parseISO(m.month + '-01'), 'MMM', { locale: ptBR }) : m.month,
      receita: r,
      custos: exp,
      ebitda: r - exp // Simplified for chart
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
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "MMMM yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
              />
            </PopoverContent>
          </Popover>
        </div>

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
            <p className="text-sm text-muted-foreground">Margem de Contribuição</p>
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
              <span className="capitalize">{format(date, "MMMM yyyy", { locale: ptBR })}</span>
              <Badge variant="outline">Visão Gerencial</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 text-left text-sm font-medium text-muted-foreground">Descrição</th>
                    <th className="py-3 text-right text-sm font-medium text-muted-foreground">Realizado</th>
                    <th className="py-3 text-right text-sm font-medium text-muted-foreground">AV %</th>
                  </tr>
                </thead>
                <tbody>
                  {dreData.map((row, idx) => {
                    const verticalAnalysis = receitaLiquida !== 0 ? (row.actual / receitaLiquida) * 100 : 0;

                    if (row.actual === 0 && !row.isHeader && !row.isTotal) return null; // Hide empty rows if not structure

                    return (
                      <tr
                        key={idx}
                        className={cn(
                          "border-b border-border/50 hover:bg-muted/10 transition-colors",
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
                          {row.isTotal || row.isHeader || Math.abs(verticalAnalysis) > 0 ? `${Math.abs(verticalAnalysis).toFixed(1)}%` : ""}
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
            <CardTitle className="text-lg">Evolução Mensal (Últimos 6 meses)</CardTitle>
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
