import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
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

interface DRELine {
  label: string;
  actual: number;
  budgeted: number;
  isHeader?: boolean;
  isTotal?: boolean;
  indent?: number;
}

const dreData: DRELine[] = [
  { label: "RECEITA BRUTA", actual: 358000, budgeted: 350000, isHeader: true },
  { label: "MRR Total", actual: 345000, budgeted: 340000, indent: 1 },
  { label: "Receitas Não Recorrentes", actual: 13000, budgeted: 10000, indent: 1 },
  
  { label: "(-) DEDUÇÕES", actual: -28640, budgeted: -28000, isHeader: true },
  { label: "Impostos sobre Receita", actual: -25060, budgeted: -24500, indent: 1 },
  { label: "Cancelamentos/Descontos", actual: -3580, budgeted: -3500, indent: 1 },
  
  { label: "= RECEITA LÍQUIDA", actual: 329360, budgeted: 322000, isTotal: true },
  
  { label: "(-) CUSTOS VARIÁVEIS", actual: -55200, budgeted: -52000, isHeader: true },
  { label: "APIs de IA", actual: -23000, budgeted: -22000, indent: 1 },
  { label: "Infraestrutura Cloud", actual: -20700, budgeted: -19000, indent: 1 },
  { label: "Gateway de Pagamento", actual: -11500, budgeted: -11000, indent: 1 },
  
  { label: "= MARGEM DE CONTRIBUIÇÃO", actual: 274160, budgeted: 270000, isTotal: true },
  
  { label: "(-) CUSTOS FIXOS", actual: -257800, budgeted: -260000, isHeader: true },
  { label: "Pessoal", actual: -168800, budgeted: -170000, indent: 1 },
  { label: "Infraestrutura Fixa", actual: -10500, budgeted: -11000, indent: 1 },
  { label: "Operacional", actual: -45500, budgeted: -46000, indent: 1 },
  { label: "Marketing", actual: -33000, budgeted: -33000, indent: 1 },
  
  { label: "= EBITDA", actual: 16360, budgeted: 10000, isTotal: true },
  
  { label: "(-) Depreciação e Amortização", actual: -2500, budgeted: -2500, indent: 1 },
  
  { label: "= EBIT", actual: 13860, budgeted: 7500, isTotal: true },
  
  { label: "(-) Despesas Financeiras", actual: -1200, budgeted: -1500, indent: 1 },
  { label: "(+) Receitas Financeiras", actual: 850, budgeted: 500, indent: 1 },
  
  { label: "= RESULTADO ANTES IR", actual: 13510, budgeted: 6500, isTotal: true },
  
  { label: "(-) IR/CSLL", actual: -3240, budgeted: -1560, indent: 1 },
  
  { label: "= LUCRO LÍQUIDO", actual: 10270, budgeted: 4940, isTotal: true },
];

const monthlyComparison = [
  { month: "Jul", receita: 285000, custos: 248000, ebitda: 8500 },
  { month: "Ago", receita: 295000, custos: 252000, ebitda: 12000 },
  { month: "Set", receita: 305000, custos: 255000, ebitda: 15200 },
  { month: "Out", receita: 320000, custos: 258000, ebitda: 18500 },
  { month: "Nov", receita: 335000, custos: 260000, ebitda: 22000 },
  { month: "Dez", receita: 348000, custos: 262000, ebitda: 28500 },
  { month: "Jan", receita: 358000, custos: 257800, ebitda: 16360 },
];

export default function Dre() {
  const receitaLiquida = dreData.find(d => d.label === "= RECEITA LÍQUIDA")?.actual || 0;
  const margemContribuicao = dreData.find(d => d.label === "= MARGEM DE CONTRIBUIÇÃO")?.actual || 0;
  const ebitda = dreData.find(d => d.label === "= EBITDA")?.actual || 0;
  const lucroLiquido = dreData.find(d => d.label === "= LUCRO LÍQUIDO")?.actual || 0;

  const margemBruta = ((margemContribuicao / receitaLiquida) * 100).toFixed(1);
  const margemEbitda = ((ebitda / receitaLiquida) * 100).toFixed(1);
  const margemLiquida = ((lucroLiquido / receitaLiquida) * 100).toFixed(1);

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
