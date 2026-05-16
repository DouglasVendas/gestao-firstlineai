import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { InvoicesTable } from "@/components/receivables/InvoicesTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, DollarSign, Clock, AlertTriangle, Search, Loader2, Users, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useFinancialData } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/formatters";
import { formatClientName } from "@/lib/clientNames";
import { CreateInvoiceModal } from "@/components/modals/CreateInvoiceModal";
import { mergeInvoicesInRange, type DisplayInvoice } from "@/utils/computeInvoices";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function sumInvoices(invoices: DisplayInvoice[]) {
    return invoices.reduce((acc, invoice) => acc + Number(invoice.value || 0), 0);
}

export function ReceivablesContent() {
    const { invoices, clients, selectedMonth, dateRange, isLoading } = useFinancialData();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("actionable");

    const allInvoices = useMemo(() => {
        return mergeInvoicesInRange(invoices || [], clients || [], dateRange, selectedMonth);
    }, [invoices, clients, dateRange, selectedMonth]);

    const periodLabel = useMemo(() => {
        if (!dateRange?.from) {
            return selectedMonth.toLocaleString("pt-BR", { month: "long", year: "numeric" });
        }

        const from = format(dateRange.from, "dd/MM/yyyy", { locale: ptBR });
        const to = format(dateRange.to ?? dateRange.from, "dd/MM/yyyy", { locale: ptBR });
        return `${from} a ${to}`;
    }, [dateRange, selectedMonth]);

    const filteredInvoices = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return allInvoices.filter((invoice) => {
            const clientName = formatClientName(invoice.client?.name || "");
            if (search && !clientName.toLowerCase().includes(search)) return false;

            if (statusFilter === "actionable") return invoice.status !== "paid" && invoice.status !== "canceled";
            if (statusFilter === "real") return !invoice.is_computed;
            if (statusFilter === "computed") return invoice.is_computed;
            if (statusFilter !== "all") return invoice.status === statusFilter;

            return true;
        });
    }, [allInvoices, searchTerm, statusFilter]);

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const realInvoices = allInvoices.filter((invoice) => !invoice.is_computed);
    const billableRealInvoices = realInvoices.filter((invoice) => invoice.status !== "canceled");
    const computedInvoices = allInvoices.filter((invoice) => invoice.is_computed);
    const paidInvoices = realInvoices.filter((invoice) => invoice.status === "paid");
    const openRealInvoices = realInvoices.filter((invoice) => invoice.status === "pending" || invoice.status === "overdue");
    const overdueRealInvoices = realInvoices.filter((invoice) => invoice.status === "overdue");
    const issuedAmount = sumInvoices(billableRealInvoices);
    const receivedAmount = sumInvoices(paidInvoices);
    const openAmount = sumInvoices(openRealInvoices);
    const forecastAmount = sumInvoices(computedInvoices);
    const overdueAmount = sumInvoices(overdueRealInvoices);
    const collectionRate = issuedAmount > 0 ? (receivedAmount / issuedAmount) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold">Recebimentos</h2>
                        <p className="text-sm text-muted-foreground">
                            Controle de faturas emitidas, pendências e previsões do período.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link to="/clients">
                                <Users className="mr-2 h-4 w-4" />
                                Clientes
                            </Link>
                        </Button>
                        <CreateInvoiceModal />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="actionable">A cobrar agora</SelectItem>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="real">Emitidas</SelectItem>
                            <SelectItem value="computed">Previstas não emitidas</SelectItem>
                            <SelectItem value="paid">Pagas</SelectItem>
                            <SelectItem value="pending">Pendentes</SelectItem>
                            <SelectItem value="overdue">Atrasadas</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar cliente..."
                            className="w-[240px] pl-8"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>

                    {(searchTerm || statusFilter !== "actionable") && (
                        <Button variant="ghost" onClick={() => { setSearchTerm(""); setStatusFilter("actionable"); }}>
                            Limpar
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <MetricCard
                    title="Faturado Emitido"
                    value={formatCurrency(issuedAmount)}
                    change={0}
                    icon={<Receipt className="h-6 w-6" />}
                    description="Somente faturas reais"
                    variant="default"
                />
                <MetricCard
                    title="Recebido"
                    value={formatCurrency(receivedAmount)}
                    change={0}
                    icon={<DollarSign className="h-6 w-6" />}
                    description="Pagamentos confirmados"
                    variant="success"
                />
                <MetricCard
                    title="Em Aberto"
                    value={formatCurrency(openAmount)}
                    change={0}
                    icon={<Clock className="h-6 w-6" />}
                    description="Faturas reais pendentes"
                    variant="warning"
                />
                <MetricCard
                    title="Previsto a Emitir"
                    value={formatCurrency(forecastAmount)}
                    change={0}
                    icon={<Sparkles className="h-6 w-6" />}
                    description="Estimativa por contrato"
                    variant="primary"
                />
                <MetricCard
                    title="Atrasado"
                    value={formatCurrency(overdueAmount)}
                    change={0}
                    icon={<AlertTriangle className="h-6 w-6" />}
                    description={`${overdueRealInvoices.length} faturas reais`}
                    variant="danger"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Leitura do Período</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Período</span>
                                <span className="text-sm font-medium">{periodLabel}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Taxa de recebimento</span>
                                <span className="font-mono font-medium">{collectionRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Faturas emitidas</span>
                                <span className="font-medium">{realInvoices.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Previsões automáticas</span>
                                <span className="font-medium">{computedInvoices.length}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Fila de Ação</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-lg bg-destructive/10 p-4">
                                <p className="text-sm text-muted-foreground">Cobrar atraso</p>
                                <p className="text-2xl font-bold text-destructive">{overdueRealInvoices.length}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(overdueAmount)}</p>
                            </div>
                            <div className="rounded-lg bg-warning/10 p-4">
                                <p className="text-sm text-muted-foreground">A receber</p>
                                <p className="text-2xl font-bold text-warning">{openRealInvoices.length}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(openAmount)}</p>
                            </div>
                            <div className="rounded-lg bg-primary/10 p-4">
                                <p className="text-sm text-muted-foreground">Gerar/confirmar</p>
                                <p className="text-2xl font-bold text-primary">{computedInvoices.length}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(forecastAmount)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {statusFilter === "actionable" ? "A cobrar agora" : "Faturas"} - {periodLabel}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {filteredInvoices.length} itens exibidos de {allInvoices.length}. A coluna com brilho indica previsão automática, ainda não emitida.
                    </p>
                </CardHeader>
                <CardContent>
                    <InvoicesTable data={filteredInvoices} />
                </CardContent>
            </Card>
        </div>
    );
}
