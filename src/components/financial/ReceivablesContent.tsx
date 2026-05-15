import { useMemo, useState } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { InvoicesTable } from "@/components/receivables/InvoicesTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, DollarSign, Clock, AlertTriangle, Send, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useFinancialData } from "@/contexts/FinancialContext";
import { useFinancialSnapshot } from "@/hooks/useFinancialMetrics";
import { formatCurrency } from "@/lib/formatters";
import { CreateInvoiceModal } from "@/components/modals/CreateInvoiceModal";
import { mergeInvoicesInRange } from "@/utils/computeInvoices";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ReceivablesContent() {
    const { invoices, clients, selectedMonth, dateRange, isLoading } = useFinancialData();
    const { current } = useFinancialSnapshot();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const allInvoices = useMemo(() => {
        return mergeInvoicesInRange(invoices || [], clients || [], dateRange, selectedMonth);
    }, [invoices, clients, dateRange, selectedMonth]);

    const periodLabel = useMemo(() => {
        if (!dateRange?.from) {
            return selectedMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        }

        const from = format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR });
        const to = format(dateRange.to ?? dateRange.from, 'dd/MM/yyyy', { locale: ptBR });
        return `${from} a ${to}`;
    }, [dateRange, selectedMonth]);

    const filteredInvoices = useMemo(() => {
        return allInvoices.filter(inv => {
            if (searchTerm) {
                const name = inv.client?.name || '';
                if (!name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            }
            if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
            return true;
        });
    }, [allInvoices, searchTerm, statusFilter]);

    if (isLoading || !current) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalFaturado = allInvoices.reduce((acc, inv) => acc + inv.value, 0);
    const totalPago = allInvoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + inv.value, 0);
    const totalPendente = allInvoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((acc, inv) => acc + inv.value, 0);
    const overdueCount = allInvoices.filter(i => i.status === 'overdue').length;
    const defaultRate = allInvoices.length > 0 ? (overdueCount / allInvoices.length) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Actions & Filters */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Status</SelectItem>
                                <SelectItem value="paid">Pagos</SelectItem>
                                <SelectItem value="pending">Pendentes</SelectItem>
                                <SelectItem value="overdue">Atrasados</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar Cliente..."
                                className="pl-8 w-[200px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {(searchTerm || statusFilter !== 'all') && (
                            <Button variant="ghost" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}>
                                Limpar
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <CreateInvoiceModal />
                        <Button variant="outline" className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Enviar Cobranças
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Faturado"
                    value={formatCurrency(totalFaturado)}
                    change={0}
                    icon={<Receipt className="h-6 w-6" />}
                    description="Esperado no período"
                    variant="default"
                />
                <MetricCard
                    title="Total Recebido"
                    value={formatCurrency(totalPago)}
                    change={0}
                    icon={<DollarSign className="h-6 w-6" />}
                    description="Confirmado no período"
                    variant="success"
                />
                <MetricCard
                    title="Em Aberto"
                    value={formatCurrency(totalPendente)}
                    change={0}
                    icon={<Clock className="h-6 w-6" />}
                    description="Pendente + Atrasado"
                    variant="warning"
                />
                <MetricCard
                    title="Inadimplência"
                    value={`${defaultRate.toFixed(1)}%`}
                    change={0}
                    icon={<AlertTriangle className="h-6 w-6" />}
                    description="Taxa do período"
                    variant="destructive"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Resumo do Mês</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Total de clientes</span>
                                <span className="font-medium">{allInvoices.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Pagos</span>
                                <span className="font-medium text-success">{allInvoices.filter(i => i.status === 'paid').length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Pendentes</span>
                                <span className="font-medium text-warning">{allInvoices.filter(i => i.status === 'pending').length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Atrasados</span>
                                <span className="font-medium text-destructive">{overdueCount}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Resumo da Lista (Filtro Atual)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-lg bg-success/10 p-4">
                                <p className="text-sm text-muted-foreground">Faturas Pagas</p>
                                <p className="text-2xl font-bold text-success">
                                    {filteredInvoices.filter(i => i.status === 'paid').length}
                                </p>
                            </div>
                            <div className="rounded-lg bg-warning/10 p-4">
                                <p className="text-sm text-muted-foreground">Pendentes</p>
                                <p className="text-2xl font-bold text-warning">
                                    {filteredInvoices.filter(i => i.status === 'pending').length}
                                </p>
                            </div>
                            <div className="rounded-lg bg-destructive/10 p-4">
                                <p className="text-sm text-muted-foreground">Atrasados</p>
                                <p className="text-2xl font-bold text-destructive">
                                    {filteredInvoices.filter(i => i.status === 'overdue').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        Faturas — {periodLabel}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <InvoicesTable data={filteredInvoices} />
                </CardContent>
            </Card>
        </div>
    );
}
