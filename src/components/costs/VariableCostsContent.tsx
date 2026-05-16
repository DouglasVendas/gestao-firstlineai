import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { VariableCostsTable } from "@/components/costs/VariableCostsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingDown, Percent, Users, AlertTriangle, Loader2 } from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useFinancialData } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/formatters";
import { CreateVariableCostModal } from "@/components/modals/CreateVariableCostModal";
import { CostsImportModal } from "@/components/modals/CostsImportModal";
import { isSameMonth, parseISO } from "date-fns";
import { useFinancialSettings } from "@/hooks/useFinancialSettings";
import { isAutomaticTaxCost, TAX_NAME } from "@/utils/automaticTaxes";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function VariableCostsContent() {
    const { variableCosts, selectedMonth, isLoading, clients, invoices, settings } = useFinancialData();
    const { updateSettings, isUpdating } = useFinancialSettings();
    const [taxRateInput, setTaxRateInput] = useState("6");

    useEffect(() => {
        if (settings?.tax_rate !== undefined) {
            setTaxRateInput((settings.tax_rate * 100).toString());
        }
    }, [settings?.tax_rate]);

    const filteredCosts = useMemo(() => {
        if (!variableCosts) return [];
        return variableCosts.filter(c => c.month && isSameMonth(parseISO(c.month), selectedMonth));
    }, [variableCosts, selectedMonth]);

    const { totalVariableCosts, categoryData } = useMemo(() => {
        if (!filteredCosts.length) return { totalVariableCosts: 0, categoryData: [] };

        const total = filteredCosts.reduce((acc, c) => acc + Number(c.amount), 0);

        const categoryMap = new Map<string, number>();
        filteredCosts.forEach(c => {
            const current = categoryMap.get(c.category) || 0;
            categoryMap.set(c.category, current + Number(c.amount));
        });

        const catData = Array.from(categoryMap.entries()).map(([name, value], index) => ({
            name,
            value,
            color: COLORS[index % COLORS.length]
        }));

        return { totalVariableCosts: total, categoryData: catData };
    }, [filteredCosts]);

    const automaticTaxCost = useMemo(() => {
        return filteredCosts.find(isAutomaticTaxCost);
    }, [filteredCosts]);

    const confirmedReceipts = useMemo(() => {
        return (invoices || [])
            .filter(inv => {
                const isPaid = inv.status === "paid" || (inv.status as string) === "pago";
                return isPaid && inv.paid_date && isSameMonth(parseISO(inv.paid_date), selectedMonth);
            })
            .reduce((acc, inv) => acc + Number(inv.value), 0);
    }, [invoices, selectedMonth]);

    const handleSaveTaxRate = async () => {
        const taxRate = Math.max(0, Number(taxRateInput || 0)) / 100;
        await updateSettings({ tax_rate: taxRate });
    };

    // Derived metrics
    const activeClientsCount = useMemo(() => {
        if (!clients) return 0;
        return clients.filter(c => c.status === 'active' || c.status === 'trial').length;
    }, [clients]);

    const totalMRR = useMemo(() => {
        if (!clients) return 0;
        return clients
            .filter(c => c.status === 'active' || c.status === 'trial')
            .reduce((acc, c) => acc + (c.mrr || 0), 0);
    }, [clients]);

    // Margem de Contribuição = MRR - Custos Variáveis
    const margemContribuicao = totalMRR > 0 ? ((totalMRR - totalVariableCosts) / totalMRR) * 100 : 0;
    const custoMedioCliente = activeClientsCount > 0 ? totalVariableCosts / activeClientsCount : 0;

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-2">
                <CostsImportModal defaultTab="variable" />
                <CreateVariableCostModal />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{TAX_NAME}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Alíquota (%)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={taxRateInput}
                                onChange={(event) => setTaxRateInput(event.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Recebimentos confirmados</Label>
                            <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 font-mono text-sm">
                                {formatCurrency(confirmedReceipts)}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Vencimento</Label>
                            <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm">
                                Dia 20
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleSaveTaxRate} disabled={isUpdating}>
                        Salvar percentual
                    </Button>
                    <div className="md:col-span-2 text-sm text-muted-foreground">
                        Valor atual: {formatCurrency(automaticTaxCost?.amount || 0)}
                    </div>
                </CardContent>
            </Card>

            {/* Metric Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Custos Variáveis"
                    value={formatCurrency(totalVariableCosts)}
                    change={0}
                    icon={<TrendingDown className="h-6 w-6" />}
                    description="Este mês"
                    variant="default" // or specific color
                />
                <MetricCard
                    title="Margem de Contribuição"
                    value={totalMRR > 0 ? `${margemContribuicao.toFixed(1)}%` : "—"}
                    change={0}
                    icon={<Percent className="h-6 w-6" />}
                    description="MRR menos custos variáveis"
                    variant={margemContribuicao < 30 ? "danger" : "default"}
                />
                <MetricCard
                    title="Custo Médio por Cliente"
                    value={activeClientsCount > 0 ? formatCurrency(custoMedioCliente) : "—"}
                    change={0}
                    icon={<Users className="h-6 w-6" />}
                    description={`Base: ${activeClientsCount} clientes ativos`}
                    variant="default"
                />
                <MetricCard
                    title="Alertas Ativos"
                    value="0"
                    change={0}
                    icon={<AlertTriangle className="h-6 w-6" />}
                    description="Nenhum alerta"
                    variant="default"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Monthly Trend - Placeholder since we filter by single month now */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Evolução por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                            Selecione um intervalo maior no dashboard para ver a evolução.
                            (Visualização mensal focada no mês selecionado)
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
                                    Sem dados para este mês.
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
                    <VariableCostsTable costs={filteredCosts} />
                </CardContent>
            </Card>
        </div>
    );
}
