import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    AlertTriangle,
    Calendar,
    Clock3,
    Filter,
    FileText,
    Loader2,
    Lock,
    MoreHorizontal,
    Paperclip,
    Pencil,
    PieChart as PieChartIcon,
    Search,
    Trash2,
    TrendingDown,
} from "lucide-react";
import {
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { differenceInCalendarDays, format, isSameMonth, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useFinancialData } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/formatters";
import { normalizeCostCategory } from "@/lib/costCategories";
import { getCostDisplayName } from "@/lib/costNames";
import { isAutomaticTaxCost, TAX_NAME } from "@/utils/automaticTaxes";
import { useFinancialSettings } from "@/hooks/useFinancialSettings";
import { FixedCost, useDeleteFixedCost } from "@/hooks/useFixedCosts";
import { VariableCost, useDeleteVariableCost } from "@/hooks/useVariableCosts";
import { CostsImportModal } from "@/components/modals/CostsImportModal";
import { EditFixedCostModal } from "@/components/modals/EditFixedCostModal";
import { EditVariableCostModal } from "@/components/modals/EditVariableCostModal";
import { CreateCostExpenseButton } from "@/components/costs/CreateCostExpenseButton";
import { useToast } from "@/hooks/use-toast";
import { CostAttachment, useOpenCostAttachment } from "@/hooks/useCostAttachments";

type CostTypeFilter = "all" | "fixed" | "variable";

type UnifiedCostItem =
    | {
        type: "fixed";
        id: string;
        name: string;
        category: string;
        amount: number;
        date: string;
        dueDate: string;
        status: FixedCost["status"];
        description?: string | null;
        attachmentsCount: number;
        source: FixedCost;
        protected: false;
    }
    | {
        type: "variable";
        id: string;
        name: string;
        category: string;
        amount: number;
        date: string;
        dueDate: null;
        status: VariableCost["status"];
        description?: string | null;
        attachmentsCount: number;
        source: VariableCost;
        protected: boolean;
    };

const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
];

function formatDateBR(value?: string | null) {
    if (!value) return "-";
    return format(parseISO(value.slice(0, 10)), "dd/MM/yyyy", { locale: ptBR });
}

function formatDueText(date: string) {
    const days = differenceInCalendarDays(parseISO(date), startOfDay(new Date()));
    if (days < 0) return `${Math.abs(days)} dia(s) em atraso`;
    if (days === 0) return "vence hoje";
    if (days === 1) return "vence amanhã";
    return `vence em ${days} dias`;
}

function statusBadge(item: UnifiedCostItem) {
    if (item.type === "fixed") {
        if (item.status === "overdue") return <Badge variant="destructive">Atrasado</Badge>;
        if (item.status === "paid") return <Badge className="bg-success text-success-foreground hover:bg-success/90">Pago</Badge>;
        if (item.status === "canceled") return <Badge variant="secondary">Cancelado</Badge>;
        return <Badge variant="outline" className="border-warning/50 text-warning">Pendente</Badge>;
    }

    if (item.status === "paid") return <Badge className="bg-success text-success-foreground hover:bg-success/90">Pago</Badge>;
    if (item.status === "canceled") return <Badge variant="secondary">Cancelado</Badge>;
    return <Badge variant="outline">Registrado</Badge>;
}

function getItemAttachments(item: UnifiedCostItem): CostAttachment[] {
    return item.source.attachments || [];
}

function getItemPaidAt(item: UnifiedCostItem) {
    if (item.type === "fixed") return item.source.payment?.paid_at || null;
    return item.source.paid_at || null;
}

function CostDetailsDialog({
    item,
    open,
    onOpenChange,
    onEdit,
}: {
    item: UnifiedCostItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: (item: UnifiedCostItem) => void;
}) {
    const { toast } = useToast();
    const openAttachment = useOpenCostAttachment();
    if (!item) return null;

    const attachments = getItemAttachments(item);
    const paidAt = getItemPaidAt(item);

    const handleOpenAttachment = (attachment: CostAttachment) => {
        openAttachment.mutate(attachment, {
            onError: (error) => toast({ variant: "destructive", title: "Erro ao abrir anexo", description: error.message }),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[620px]">
                <DialogHeader>
                    <DialogTitle>{item.name}</DialogTitle>
                    <DialogDescription>
                        Visualização do lançamento e comprovantes vinculados.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Tipo</p>
                            <div className="mt-1">{item.type === "fixed" ? "Custo fixo" : "Custo variável"}</div>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                            <div className="mt-1">{statusBadge(item)}</div>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Valor</p>
                            <div className="mt-1 font-mono font-medium">{formatCurrency(item.amount)}</div>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Data</p>
                            <div className="mt-1">{item.type === "fixed" ? formatDateBR(item.dueDate) : formatDateBR(item.date)}</div>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Categoria</p>
                            <div className="mt-1">{item.category}</div>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Pagamento</p>
                            <div className="mt-1">{paidAt ? formatDateBR(paidAt) : "Não informado"}</div>
                        </div>
                    </div>

                    {item.description && (
                        <div className="rounded-lg border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Descrição</p>
                            <p className="mt-1 text-sm">{item.description}</p>
                        </div>
                    )}

                    <div className="rounded-lg border p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Anexos</p>
                        {attachments.length ? (
                            <div className="mt-3 space-y-2">
                                {attachments.map((attachment) => (
                                    <button
                                        key={attachment.id}
                                        type="button"
                                        className="flex w-full items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2 text-left text-sm hover:bg-muted/40"
                                        onClick={() => handleOpenAttachment(attachment)}
                                    >
                                        <span className="flex min-w-0 items-center gap-2">
                                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <span className="truncate">{attachment.file_name}</span>
                                        </span>
                                        <Badge variant="secondary">Abrir</Badge>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-muted-foreground">Nenhum anexo salvo para este lançamento.</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
                    {!item.protected && (
                        <Button
                            onClick={() => {
                                onOpenChange(false);
                                onEdit(item);
                            }}
                        >
                            Editar status e dados
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function CostsContent() {
    const { fixedCosts, variableCosts, selectedMonth, isLoading, clients, invoices, settings } = useFinancialData();
    const { updateSettings, isUpdating } = useFinancialSettings();
    const { toast } = useToast();
    const deleteFixedCost = useDeleteFixedCost();
    const deleteVariableCost = useDeleteVariableCost();

    const [typeFilter, setTypeFilter] = useState<CostTypeFilter>("all");
    const [search, setSearch] = useState("");
    const [taxRateInput, setTaxRateInput] = useState("6");
    const [editFixedTarget, setEditFixedTarget] = useState<FixedCost | null>(null);
    const [editVariableTarget, setEditVariableTarget] = useState<VariableCost | null>(null);
    const [detailsTarget, setDetailsTarget] = useState<UnifiedCostItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<UnifiedCostItem | null>(null);

    useEffect(() => {
        if (settings?.tax_rate !== undefined) {
            setTaxRateInput((settings.tax_rate * 100).toString());
        }
    }, [settings?.tax_rate]);

    const items = useMemo<UnifiedCostItem[]>(() => {
        const fixedItems = (fixedCosts || [])
            .filter((cost) => cost.month && isSameMonth(parseISO(cost.month), selectedMonth))
            .map((cost): UnifiedCostItem => ({
                type: "fixed",
                id: cost.id,
                name: cost.name,
                category: normalizeCostCategory(cost.category),
                amount: Number(cost.actual || 0),
                date: cost.month,
                dueDate: cost.due_date,
                status: cost.status,
                description: cost.description,
                attachmentsCount: cost.attachments?.length || 0,
                source: cost,
                protected: false,
            }));

        const variableItems = (variableCosts || [])
            .filter((cost) => cost.month && isSameMonth(parseISO(cost.month), selectedMonth))
            .map((cost): UnifiedCostItem => ({
                type: "variable",
                id: cost.id,
                name: getCostDisplayName(cost),
                category: normalizeCostCategory(cost.category),
                amount: Number(cost.amount || 0),
                date: cost.month,
                dueDate: null,
                status: cost.status,
                description: cost.description,
                attachmentsCount: cost.attachments?.length || 0,
                source: cost,
                protected: isAutomaticTaxCost(cost),
            }));

        return [...fixedItems, ...variableItems].sort((a, b) => {
            const dateA = a.dueDate || a.date;
            const dateB = b.dueDate || b.date;
            return dateA.localeCompare(dateB) || a.name.localeCompare(b.name);
        });
    }, [fixedCosts, selectedMonth, variableCosts]);

    const visibleItems = useMemo(() => {
        const query = search.trim().toLowerCase();
        return items.filter((item) => {
            const matchesType = typeFilter === "all" || item.type === typeFilter;
            const matchesSearch = !query
                || item.name.toLowerCase().includes(query)
                || item.category.toLowerCase().includes(query)
                || (item.description || "").toLowerCase().includes(query);
            return matchesType && matchesSearch;
        });
    }, [items, search, typeFilter]);

    const {
        totalCosts,
        fixedTotal,
        variableTotal,
        categoryData,
        overdueFixed,
        upcomingFixed,
        dueThisMonth,
        activeClientsCount,
        totalMRR,
        automaticTaxCost,
        confirmedReceipts,
    } = useMemo(() => {
        const total = items.reduce((acc, item) => acc + item.amount, 0);
        const fixed = items.filter((item) => item.type === "fixed").reduce((acc, item) => acc + item.amount, 0);
        const variable = items.filter((item) => item.type === "variable").reduce((acc, item) => acc + item.amount, 0);

        const categoryMap = new Map<string, number>();
        items.forEach((item) => {
            categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + item.amount);
        });

        const categories = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name, value], index) => ({
                name,
                value,
                color: COLORS[index % COLORS.length],
            }));

        const today = startOfDay(new Date());
        const fixedOnly = items.filter((item) => item.type === "fixed") as Extract<UnifiedCostItem, { type: "fixed" }>[];
        const overdue = fixedOnly
            .filter((item) => item.status === "overdue")
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        const upcoming = fixedOnly
            .filter((item) => item.status === "pending" && differenceInCalendarDays(parseISO(item.dueDate), today) >= 0)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        const due = fixedOnly.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

        const activeClients = (clients || []).filter((client) => client.status === "active" || client.status === "trial").length;
        const mrr = (clients || [])
            .filter((client) => client.status === "active" || client.status === "trial")
            .reduce((acc, client) => acc + (client.mrr || 0), 0);

        const taxCost = (variableCosts || [])
            .filter((cost) => cost.month && isSameMonth(parseISO(cost.month), selectedMonth))
            .find(isAutomaticTaxCost);

        const receipts = (invoices || [])
            .filter((invoice) => {
                const paid = invoice.status === "paid" || (invoice.status as string) === "pago";
                return paid && invoice.paid_date && isSameMonth(parseISO(invoice.paid_date), selectedMonth);
            })
            .reduce((acc, invoice) => acc + Number(invoice.value || 0), 0);

        return {
            totalCosts: total,
            fixedTotal: fixed,
            variableTotal: variable,
            categoryData: categories,
            overdueFixed: overdue,
            upcomingFixed: upcoming,
            dueThisMonth: due,
            activeClientsCount: activeClients,
            totalMRR: mrr,
            automaticTaxCost: taxCost,
            confirmedReceipts: receipts,
        };
    }, [clients, invoices, items, selectedMonth, variableCosts]);

    const contributionMargin = totalMRR > 0 ? ((totalMRR - variableTotal) / totalMRR) * 100 : 0;
    const averageVariableCostPerClient = activeClientsCount > 0 ? variableTotal / activeClientsCount : 0;

    const handleSaveTaxRate = async () => {
        const taxRate = Math.max(0, Number(taxRateInput || 0)) / 100;
        await updateSettings({ tax_rate: taxRate });
    };

    const handleEdit = (item: UnifiedCostItem) => {
        if (item.protected) return;
        if (item.type === "fixed") setEditFixedTarget(item.source);
        else setEditVariableTarget(item.source);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;

        if (deleteTarget.type === "fixed") {
            deleteFixedCost.mutate(deleteTarget.source.recurring_id, {
                onSuccess: () => {
                    toast({ title: "Custo fixo excluído", description: `"${deleteTarget.name}" foi removido da recorrência.` });
                    setDeleteTarget(null);
                },
                onError: (error) => toast({ variant: "destructive", title: "Erro ao excluir", description: error.message }),
            });
            return;
        }

        deleteVariableCost.mutate(deleteTarget.id, {
            onSuccess: () => {
                toast({ title: "Custo variável excluído", description: `"${deleteTarget.name}" foi removido.` });
                setDeleteTarget(null);
            },
            onError: (error) => toast({ variant: "destructive", title: "Erro ao excluir", description: error.message }),
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Custos e Despesas</h2>
                    <p className="text-sm text-muted-foreground">
                        Visão única com filtro por custos fixos recorrentes e variáveis pontuais.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <CostsImportModal />
                    <CreateCostExpenseButton />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{TAX_NAME}</CardTitle>
                    <CardDescription>Imposto automático calculado sobre recebimentos confirmados.</CardDescription>
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
                            <Label>Valor atual</Label>
                            <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 font-mono text-sm">
                                {formatCurrency(automaticTaxCost?.amount || 0)}
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleSaveTaxRate} disabled={isUpdating}>
                        Salvar percentual
                    </Button>
                </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Total de Custos"
                    value={formatCurrency(totalCosts)}
                    change={0}
                    icon={<TrendingDown className="h-6 w-6" />}
                    description="Fixos + variáveis no mês"
                    variant="default"
                />
                <MetricCard
                    title="Custos Fixos"
                    value={formatCurrency(fixedTotal)}
                    change={0}
                    icon={<Calendar className="h-6 w-6" />}
                    description="Recorrências do mês"
                    variant="primary"
                />
                <MetricCard
                    title="Custos Variáveis"
                    value={formatCurrency(variableTotal)}
                    change={0}
                    icon={<PieChartIcon className="h-6 w-6" />}
                    description={totalMRR > 0 ? `Margem contribuição: ${contributionMargin.toFixed(1)}%` : "Lançamentos pontuais"}
                    variant={contributionMargin < 30 && totalMRR > 0 ? "warning" : "default"}
                />
                <MetricCard
                    title="Custo Médio por Cliente"
                    value={activeClientsCount > 0 ? formatCurrency(averageVariableCostPerClient) : "—"}
                    change={0}
                    icon={<AlertCircle className="h-6 w-6" />}
                    description={`Base: ${activeClientsCount} cliente(s) ativo(s)`}
                    variant="default"
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <Card className={overdueFixed.length ? "border-destructive/50 bg-destructive/5" : ""}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Alerta Prioritário
                        </CardTitle>
                        <CardDescription>Pagamentos fixos vencidos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {overdueFixed.length ? (
                            <div className="space-y-3">
                                {overdueFixed.slice(0, 5).map((item) => (
                                    <div key={item.id} className="rounded-lg border border-destructive/30 bg-background/70 p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatDateBR(item.dueDate)} · {formatDueText(item.dueDate)}</p>
                                            </div>
                                            <span className="font-mono text-sm">{formatCurrency(item.amount)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-[150px] items-center justify-center text-center text-sm text-muted-foreground">
                                Nenhum pagamento fixo em atraso no mês selecionado.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Clock3 className="h-5 w-5 text-warning" />
                            Próximos Pagamentos
                        </CardTitle>
                        <CardDescription>Alertas por proximidade da data de vencimento.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {upcomingFixed.length ? (
                            <div className="space-y-3">
                                {upcomingFixed.slice(0, 5).map((item) => {
                                    const days = differenceInCalendarDays(parseISO(item.dueDate), startOfDay(new Date()));
                                    const nearDue = days <= 3;
                                    return (
                                        <div key={item.id} className={`rounded-lg border p-3 ${nearDue ? "border-warning/50 bg-warning/5" : ""}`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">{formatDateBR(item.dueDate)} · {formatDueText(item.dueDate)}</p>
                                                </div>
                                                {nearDue && <Badge variant="outline" className="border-warning/50 text-warning">Atenção</Badge>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex h-[150px] items-center justify-center text-center text-sm text-muted-foreground">
                                Nenhum pagamento pendente com vencimento futuro neste mês.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="h-5 w-5" />
                            Vencimentos
                        </CardTitle>
                        <CardDescription>Agenda dos custos fixos do mês.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dueThisMonth.length ? (
                            <div className="space-y-3">
                                {dueThisMonth.slice(0, 5).map((item) => (
                                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatDateBR(item.dueDate)}</p>
                                        </div>
                                        {statusBadge(item)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-[150px] items-center justify-center text-center text-sm text-muted-foreground">
                                Nenhum custo fixo previsto neste mês.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Evolução por Categoria</CardTitle>
                        <CardDescription>Comparativo de custos por categoria no mês selecionado.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {categoryData.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={categoryData} margin={{ top: 8, right: 8, bottom: 24, left: 8 }}>
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} angle={-15} textAnchor="end" height={70} />
                                        <YAxis tickFormatter={(value) => `R$ ${Number(value) / 1000}k`} tickLine={false} axisLine={false} width={70} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                                            formatter={(value: number) => [formatCurrency(value), "Total"]}
                                        />
                                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                            {categoryData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    Sem dados de custos para este mês.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Distribuição por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[210px]">
                            {categoryData.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={52} outerRadius={82} dataKey="value">
                                            {categoryData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                                            formatter={(value: number) => [formatCurrency(value), "Total"]}
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
                            {categoryData.map((category) => (
                                <div key={category.name} className="flex items-center justify-between gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                                        <span>{category.name}</span>
                                    </div>
                                    <span className="font-medium">{formatCurrency(category.value)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle className="text-lg">Lançamentos</CardTitle>
                            <CardDescription>Lista única de custos fixos e variáveis.</CardDescription>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="relative min-w-[240px]">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Buscar custo..."
                                    className="pl-9"
                                />
                            </div>
                            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as CostTypeFilter)}>
                                <SelectTrigger className="w-full sm:w-[190px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="fixed">Fixos</SelectItem>
                                    <SelectItem value="variable">Variáveis</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Anexos</TableHead>
                                    <TableHead className="w-[50px]" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleItems.length ? (
                                    visibleItems.map((item) => (
                                        <TableRow
                                            key={`${item.type}-${item.id}`}
                                            className="cursor-pointer"
                                            onClick={() => setDetailsTarget(item)}
                                        >
                                            <TableCell>
                                                <Badge variant={item.type === "fixed" ? "default" : "secondary"}>
                                                    {item.type === "fixed" ? "Fixo" : "Variável"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{item.name}</p>
                                                        {item.protected && (
                                                            <Badge variant="secondary" className="gap-1">
                                                                <Lock className="h-3 w-3" />
                                                                Automático
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {item.description && item.description !== item.name && (
                                                        <p className="text-xs text-muted-foreground">{item.description}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{item.category}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {item.type === "fixed" ? formatDateBR(item.dueDate) : formatDateBR(item.date)}
                                            </TableCell>
                                            <TableCell>{statusBadge(item)}</TableCell>
                                            <TableCell>
                                                {item.attachmentsCount ? (
                                                    <Badge variant="secondary" className="gap-1">
                                                        <Paperclip className="h-3 w-3" />
                                                        {item.attachmentsCount}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {!item.protected && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={(event) => event.stopPropagation()}
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                                                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setDeleteTarget(item)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                            Nenhum custo encontrado para os filtros atuais.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <EditFixedCostModal
                cost={editFixedTarget}
                open={!!editFixedTarget}
                onOpenChange={(open) => !open && setEditFixedTarget(null)}
            />
            <EditVariableCostModal
                cost={editVariableTarget}
                open={!!editVariableTarget}
                onOpenChange={(open) => !open && setEditVariableTarget(null)}
            />
            <CostDetailsDialog
                item={detailsTarget}
                open={!!detailsTarget}
                onOpenChange={(open) => !open && setDetailsTarget(null)}
                onEdit={handleEdit}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget?.type === "fixed"
                                ? `Isso removerá a recorrência "${deleteTarget.name}" e seus próximos meses.`
                                : `Isso removerá o lançamento "${deleteTarget?.name || ""}".`}
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
