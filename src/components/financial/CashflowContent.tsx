import { useMemo, useState } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Wallet, Download, Loader2, Calendar as CalendarIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditTransactionModal } from "@/components/modals/EditTransactionModal";
import { useDeleteTransaction } from "@/hooks/useUpdateTransaction";
import { Transaction } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
} from "recharts";
import { useFinancialData } from "@/contexts/FinancialContext";
import { buildCashflowChartData } from "@/lib/cashflowChartData";
import { getCostDisplayName } from "@/lib/costNames";
import { cn } from "@/lib/utils";
import { CreateTransactionModal } from "@/components/modals/CreateTransactionModal";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import { format } from "date-fns";

interface CashflowItem {
    id: string;
    description: string;
    category: string;
    amount: number;
    type: 'entrada' | 'saida';
    date: string;
    status: 'completed' | 'pending';
}

const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

const formatDate = (date: string) => {
    try {
        if (!date) return "-";
        return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
    } catch (e) {
        return "-";
    }
};

export function CashflowContent() {
    const { invoices, fixedCosts, variableCosts, transactions, selectedMonth, setSelectedMonth, dateRange, setDateRange, isLoading } = useFinancialData();
    const deleteTransaction = useDeleteTransaction();
    const { toast } = useToast();
    const [editTarget, setEditTarget] = useState<Transaction | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

    const cashflowItems = useMemo<CashflowItem[]>(() => {
        if (isLoading) return [];

        const items: CashflowItem[] = [];

        // 1. Invoices (Entradas)
        invoices.forEach(inv => {
            if (inv.status === 'paid' && inv.paid_date) {
                items.push({
                    id: `inv-${inv.id}`,
                    description: inv.client?.name || "Cliente sem nome",
                    category: "Venda",
                    amount: inv.value,
                    type: 'entrada',
                    date: inv.paid_date,
                    status: 'completed'
                });
            }
        });

        // 2. Fixed Costs (Saídas)
        fixedCosts.forEach(fc => {
            if (fc.month) {
                items.push({
                    id: `fc-${fc.id}`,
                    description: getCostDisplayName(fc),
                    category: fc.category,
                    amount: fc.actual,
                    type: 'saida',
                    date: fc.due_date || fc.month,
                    status: fc.status === 'paid' ? 'completed' : 'pending'
                });
            }
        });

        // 3. Variable Costs (Saídas)
        variableCosts.forEach(vc => {
            if (vc.month) {
                items.push({
                    id: `vc-${vc.id}`,
                    description: getCostDisplayName(vc),
                    category: vc.category,
                    amount: vc.amount,
                    type: 'saida',
                    date: vc.month, // vc.month is already YYYY-MM-DD from DB
                    status: vc.status === 'pending' ? 'pending' : 'completed'
                });
            }
        });

        // 4. Transactions (Gerais como C6 Bank, mas NÃO Vendas de Planos, pois estas vêm de Invoices)
        transactions.forEach(t => {
            const isVendaOrPlano = t.category === "Venda" || t.category === "Plano" || (t.description || "").toLowerCase().startsWith("venda");

            if (!isVendaOrPlano) {
                items.push({
                    id: `tx-${t.id}`,
                    description: t.description || "Sem descrição",
                    category: t.category || "Outros",
                    amount: t.amount,
                    type: (t.type === 'income' || t.type === 'entrada') ? 'entrada' : 'saida',
                    date: t.date,
                    status: t.status === 'completed' ? 'completed' : 'pending'
                });
            }
        });

        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [invoices, fixedCosts, variableCosts, transactions, isLoading]);

    const currentMonthItems = useMemo(() => {
        if (!dateRange?.from) return [];

        const fromStr = format(dateRange.from, 'yyyy-MM-dd');
        const toStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : fromStr;

        return cashflowItems.filter(item => {
            if (!item.date) return false;
            const itemDateStr = item.date.substring(0, 10);
            return itemDateStr >= fromStr && itemDateStr <= toStr;
        });
    }, [cashflowItems, dateRange]);

    const stats = useMemo(() => {
        const incomeItems = currentMonthItems.filter(i => i.type === 'entrada');

        // A Receita Operacional (Gross Revenue) desconsidera resgates de Fundos/CDB
        const revenue = incomeItems
            .filter(i => !(i.category || "").toLowerCase().includes("investimento"))
            .reduce((acc, i) => acc + i.amount, 0);

        // O Valor de Resgate retornado para a conta (Não é Faturamento)
        const investmentReturn = incomeItems
            .filter(i => (i.category || "").toLowerCase().includes("investimento"))
            .reduce((acc, i) => acc + i.amount, 0);

        const expenses = currentMonthItems.filter(i => i.type === 'saida').reduce((acc, i) => acc + i.amount, 0);

        return {
            revenue,
            investmentReturn,
            expenses,
            balance: (revenue + investmentReturn) - expenses
        };
    }, [currentMonthItems]);

    const groupedItems = useMemo(() => {
        const isVenda = (i: CashflowItem) => (i.category || "").toLowerCase() === "venda" || (i.category || "").toLowerCase() === "plano" || (i.description || "").toLowerCase().startsWith("venda");

        const vendas = currentMonthItems.filter(isVenda);
        const impostos = currentMonthItems.filter(i => (i.category || "").toLowerCase().includes("imposto") && !isVenda(i));
        const proLabore = currentMonthItems.filter(i => ((i.category || "").toLowerCase().includes("pro-labore") || (i.category || "").toLowerCase().includes("pró-labore")) && !isVenda(i));
        const investimento = currentMonthItems.filter(i => (i.category || "").toLowerCase().includes("investimento") && !isVenda(i));

        const isFatura = (i: CashflowItem) => (i.category || "").toLowerCase().includes("cartão") || (i.description || "").toLowerCase().includes("cartao") || (i.description || "").toLowerCase().includes("fatura");

        const faturas = currentMonthItems.filter(i =>
            ((i.description || "").toLowerCase().includes("c6 bank") || (i.description || "").toLowerCase().includes("c6")) &&
            isFatura(i) &&
            !isVenda(i)
        );

        const santander = currentMonthItems.filter(i =>
            (i.description || "").toLowerCase().includes("santander") &&
            isFatura(i) &&
            !isVenda(i)
        );

        // Outros são aqueles que não entraram nas categorias acima
        const outros = currentMonthItems.filter(i =>
            !vendas.includes(i) &&
            !impostos.includes(i) &&
            !faturas.includes(i) &&
            !santander.includes(i) &&
            !proLabore.includes(i) &&
            !investimento.includes(i)
        );

        return { vendas, impostos, faturas, santander, proLabore, investimento, outros };
    }, [currentMonthItems]);

    const sumCategory = (items: CashflowItem[]) => items.reduce((acc, i) => acc + i.amount, 0);

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteTransaction.mutate(deleteTarget.id, {
            onSuccess: () => {
                toast({ title: "Transação excluída", description: `"${deleteTarget.description}" foi removida.` });
                setDeleteTarget(null);
            },
            onError: (err) => toast({ variant: "destructive", title: "Erro ao excluir", description: err.message }),
        });
    };

    const renderTransactionItem = (transaction: CashflowItem) => {
        // Only transactions from the 'transactions' table are editable/deletable
        const isRealTransaction = transaction.id.startsWith('tx-');
        const originalTxId = isRealTransaction ? transaction.id.replace('tx-', '') : null;
        const originalTx = originalTxId ? transactions.find(t => t.id === originalTxId) ?? null : null;

        return (
            <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors mb-2"
            >
                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full",
                            transaction.type === "entrada"
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive"
                        )}
                    >
                        {transaction.type === "entrada" ? (
                            <TrendingUp className="h-4 w-4" />
                        ) : (
                            <TrendingDown className="h-4 w-4" />
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                            {transaction.category} • {formatDate(transaction.date)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-right">
                        <p
                            className={cn(
                                "font-semibold text-sm",
                                transaction.type === "entrada"
                                    ? "text-success"
                                    : "text-destructive"
                            )}
                        >
                            {transaction.type === "entrada" ? "+" : "-"}{" "}
                            {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {transaction.status === "completed" ? "Confirmado" : "Pendente"}
                        </p>
                    </div>
                    {isRealTransaction && originalTx && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditTarget(originalTx)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setDeleteTarget(originalTx)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        );
    };

    const chartData = useMemo(() => {
        return buildCashflowChartData(cashflowItems, selectedMonth, dateRange);
    }, [cashflowItems, selectedMonth, dateRange]);


    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {/* Global Date Range Selector integration */}
                    <DatePickerWithRange
                        date={dateRange}
                        onDateChange={(range) => {
                            setDateRange(range);
                            if (range?.from) {
                                setSelectedMonth(range.from);
                            }
                        }}
                    />

                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </div>
                <CreateTransactionModal />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <MetricCard
                    title="Saldo Atual (Caixa)"
                    value={formatCurrency(chartData[chartData.length - 1]?.saldo ?? 0)}
                    change={0}
                    icon={Wallet}
                    description="Saldo acumulado total"
                    variant="primary"
                    allowPrivacy={true}
                />
                <MetricCard
                    title="Entradas (Vendas)"
                    value={formatCurrency(stats.revenue)}
                    change={0}
                    icon={TrendingUp}
                    description="Faturamento bruto operacional"
                    variant="success"
                />
                <MetricCard
                    title="Resgates de Invest."
                    value={formatCurrency(stats.investmentReturn)}
                    change={0}
                    icon={TrendingUp}
                    description="Retornos dos Fundos/CDB"
                    variant="primary"
                />
                <MetricCard
                    title="Saídas"
                    value={formatCurrency(stats.expenses)}
                    change={0}
                    icon={TrendingDown}
                    description="Despesas do período"
                    variant="danger"
                />
                <MetricCard
                    title="Saldo do Mês"
                    value={formatCurrency(stats.balance)}
                    change={0}
                    icon={DollarSign}
                    description="Resultado líquido selecionado"
                    variant={stats.balance >= 0 ? "success" : "danger"}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Balance Evolution Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Evolução do Saldo no Período</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                        formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="saldo"
                                        stroke="hsl(var(--primary))"
                                        fillOpacity={1}
                                        fill="url(#colorSaldo)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Cash Flow Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Entradas vs Saídas no Período</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
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
                                    <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Transações do Período</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 min-h-[400px]">
                        {currentMonthItems.length > 0 ? (
                            <Accordion type="multiple" className="w-full">
                                {groupedItems.faturas.length > 0 && (
                                    <AccordionItem value="faturas">
                                        <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-4 rounded-md">
                                            <div className="flex justify-between w-full pr-4">
                                                <span>Fatura Cartão C6 Bank</span>
                                                <span className="text-destructive font-medium">{formatCurrency(sumCategory(groupedItems.faturas))}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 pb-2 px-2">
                                            {groupedItems.faturas.map(renderTransactionItem)}
                                        </AccordionContent>
                                    </AccordionItem>
                                )}

                                {groupedItems.santander.length > 0 && (
                                    <AccordionItem value="santander">
                                        <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-4 rounded-md">
                                            <div className="flex justify-between w-full pr-4">
                                                <span>Fatura Cartão Santander</span>
                                                <span className="text-destructive font-medium">{formatCurrency(sumCategory(groupedItems.santander))}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 pb-2 px-2">
                                            {groupedItems.santander.map(renderTransactionItem)}
                                        </AccordionContent>
                                    </AccordionItem>
                                )}

                                {groupedItems.investimento.length > 0 && (
                                    <AccordionItem value="investimento">
                                        <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-4 rounded-md">
                                            <div className="flex justify-between w-full pr-4">
                                                <span>Aplicações e Investimentos</span>
                                                <span className="text-destructive font-medium">{formatCurrency(sumCategory(groupedItems.investimento))}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 pb-2 px-2">
                                            {groupedItems.investimento.map(renderTransactionItem)}
                                        </AccordionContent>
                                    </AccordionItem>
                                )}

                                {groupedItems.vendas.length > 0 && (
                                    <AccordionItem value="vendas">
                                        <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-4 rounded-md">
                                            <div className="flex justify-between w-full pr-4">
                                                <span>Vendas</span>
                                                <span className="text-success font-medium">{formatCurrency(sumCategory(groupedItems.vendas))}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 pb-2 px-2">
                                            {groupedItems.vendas.map(renderTransactionItem)}
                                        </AccordionContent>
                                    </AccordionItem>
                                )}

                                {groupedItems.impostos.length > 0 && (
                                    <AccordionItem value="impostos">
                                        <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-4 rounded-md">
                                            <div className="flex justify-between w-full pr-4">
                                                <span>Impostos</span>
                                                <span className="text-destructive font-medium">{formatCurrency(sumCategory(groupedItems.impostos))}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 pb-2 px-2">
                                            {groupedItems.impostos.map(renderTransactionItem)}
                                        </AccordionContent>
                                    </AccordionItem>
                                )}

                                {groupedItems.proLabore.length > 0 && (
                                    <AccordionItem value="prolabore">
                                        <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-4 rounded-md">
                                            <div className="flex justify-between w-full pr-4">
                                                <span>Pró-Labore</span>
                                                <span className="text-destructive font-medium">{formatCurrency(sumCategory(groupedItems.proLabore))}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 pb-2 px-2">
                                            {groupedItems.proLabore.map(renderTransactionItem)}
                                        </AccordionContent>
                                    </AccordionItem>
                                )}

                                {groupedItems.outros.length > 0 && (
                                    <AccordionItem value="outros">
                                        <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-4 rounded-md">
                                            <div className="flex justify-between w-full pr-4">
                                                <span>Outros Custos / Transações</span>
                                                <span className="text-muted-foreground font-medium">{formatCurrency(sumCategory(groupedItems.outros))}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 pb-2 px-2">
                                            {groupedItems.outros.map(renderTransactionItem)}
                                        </AccordionContent>
                                    </AccordionItem>
                                )}
                            </Accordion>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground pt-10">
                                Nenhuma transação encontrada para este período.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <EditTransactionModal
                transaction={editTarget}
                open={!!editTarget}
                onOpenChange={(v) => !v && setEditTarget(null)}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir "{deleteTarget?.description}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
