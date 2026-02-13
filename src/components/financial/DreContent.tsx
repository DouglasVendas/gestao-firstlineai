import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useFinancialData } from "@/contexts/FinancialContext";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";

interface DRELine {
    label: string;
    actual: number;
    budgeted: number;
    isHeader?: boolean;
    isTotal?: boolean;
    indent?: number;
}

export function DreContent() {
    const { invoices, fixedCosts, variableCosts, selectedMonth, setSelectedMonth, isLoading: isLoadingData } = useFinancialData();

    const selectedMonthStr = useMemo(() => {
        return format(selectedMonth, 'yyyy-MM');
    }, [selectedMonth]);

    // --- Calculations ---

    // 1. Gross Revenue (Receita Bruta) - Paid Invoices in the selected month
    const receitaBruta = useMemo(() => {
        if (!invoices) return 0;
        return invoices
            .filter(inv => {
                if (inv.status !== 'paid' || !inv.paid_date) return false;
                return inv.paid_date.startsWith(selectedMonthStr);
            })
            .reduce((sum, inv) => sum + (inv.value || 0), 0);
    }, [invoices, selectedMonthStr]);

    // 2. Variable Costs & Taxes
    const currentVariableCosts = useMemo(() => {
        if (!variableCosts) return [];
        return variableCosts.filter(c => c.month === selectedMonthStr || (c.month && c.month.startsWith(selectedMonthStr)));
    }, [variableCosts, selectedMonthStr]);

    const impostos = useMemo(() => {
        return currentVariableCosts
            .filter(c => ['Impostos', 'DARF', 'Simples Nacional', 'Taxas'].includes(c.category) || c.category.toUpperCase().includes('DARF') || c.category.toUpperCase().includes('SIMPLES'))
            .reduce((acc, c) => acc + c.amount, 0);
    }, [currentVariableCosts]);

    const receitaLiquida = receitaBruta - impostos;

    const totalVariable = useMemo(() => {
        return currentVariableCosts
            .filter(c => !['Impostos', 'DARF', 'Simples Nacional', 'Taxas'].includes(c.category) && !c.category.toUpperCase().includes('DARF') && !c.category.toUpperCase().includes('SIMPLES'))
            .reduce((acc, c) => acc + c.amount, 0);
    }, [currentVariableCosts]);

    const margemContribuicao = receitaLiquida - totalVariable;

    // 3. Fixed Costs
    const currentFixedCosts = useMemo(() => {
        if (!fixedCosts) return [];
        return fixedCosts.filter(c => {
            if (c.month) return c.month === selectedMonthStr || c.month.startsWith(selectedMonthStr);
            return false;
        });
    }, [fixedCosts, selectedMonthStr]);

    const totalFixed = currentFixedCosts.reduce((acc, c) => acc + c.actual, 0);

    const ebitda = margemContribuicao - totalFixed;
    const depAmort = 0; // Placeholder
    const ebit = ebitda - depAmort;
    const resFinanceiro = 0; // Placeholder
    const lucroAntesIR = ebit + resFinanceiro;
    const irCsll = 0; // Placeholder
    const lucroLiquido = lucroAntesIR - irCsll;

    // --- DRE Data Structure ---
    const dreData: DRELine[] = [
        { label: "RECEITA BRUTA", actual: receitaBruta, budgeted: 0, isHeader: true },
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

    // Metrics Calculation for Summary Cards
    const margemBruta = receitaLiquida ? ((margemContribuicao / receitaLiquida) * 100).toFixed(1) : "0.0";
    const margemEbitda = receitaLiquida ? ((ebitda / receitaLiquida) * 100).toFixed(1) : "0.0";
    const margemLiquida = receitaLiquida ? ((lucroLiquido / receitaLiquida) * 100).toFixed(1) : "0.0";

    if (isLoadingData) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

                {/* Date Filter */}
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal",
                                    !selectedMonth && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedMonth ? format(selectedMonth, "MMMM yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={selectedMonth}
                                onSelect={(d) => d && setSelectedMonth(d)}
                                initialFocus
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

            <div className="grid gap-6 lg:grid-cols-3">
                {/* DRE Table */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-lg">
                            <span className="capitalize">{format(selectedMonth, "MMMM yyyy", { locale: ptBR })}</span>
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

                                        if (row.actual === 0 && !row.isHeader && !row.isTotal) return null;

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
                        <CardTitle className="text-lg">Nota</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Evolução histórica será reativada em breve.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
