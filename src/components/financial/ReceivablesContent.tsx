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
import { isSameMonth, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export function ReceivablesContent() {
    const { invoices, selectedMonth, isLoading } = useFinancialData();
    const { current } = useFinancialSnapshot();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredInvoices = useMemo(() => {
        if (!invoices) return [];
        return invoices.filter(inv => {
            if (inv.due_date && !isSameMonth(parseISO(inv.due_date), selectedMonth)) {
                return false;
            }
            if (searchTerm) {
                const clientName = (inv as any).clients?.name || '';
                if (!clientName.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return false;
                }
            }
            if (statusFilter !== 'all' && inv.status !== statusFilter) {
                return false;
            }
            return true;
        });
    }, [invoices, selectedMonth, searchTerm, statusFilter]);

    if (isLoading || !current) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalInvoicedInMonth = invoices?.filter(inv => isSameMonth(parseISO(inv.due_date), selectedMonth)).reduce((acc, inv) => acc + inv.value, 0) || 0;
    const monthCount = invoices?.filter(inv => isSameMonth(parseISO(inv.due_date), selectedMonth)).length || 1;
    const monthOverdueCount = invoices?.filter(inv => isSameMonth(parseISO(inv.due_date), selectedMonth) && inv.status === 'overdue').length || 0;
    const monthDefaultRate = (monthOverdueCount / monthCount) * 100;

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
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setSearchTerm("");
                                    setStatusFilter("all");
                                }}
                            >
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
                    value={formatCurrency(totalInvoicedInMonth)}
                    change={0}
                    icon={<Receipt className="h-6 w-6" />}
                    description="Competência (Vencimento)"
                    variant="default"
                />
                <MetricCard
                    title="Total Recebido"
                    value={formatCurrency(current.revenue)}
                    change={0}
                    icon={<DollarSign className="h-6 w-6" />}
                    description="Caixa (Pago este mês)"
                    variant="success"
                />
                <MetricCard
                    title="Em Aberto"
                    value={formatCurrency(current.pending)}
                    change={0}
                    icon={<Clock className="h-6 w-6" />}
                    description="A vencer este mês"
                    variant="warning"
                />
                <MetricCard
                    title="Inadimplência"
                    value={`${monthDefaultRate.toFixed(1)}%`}
                    change={0}
                    icon={<AlertTriangle className="h-6 w-6" />}
                    description="Taxa deste mês"
                    variant="destructive"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Taxa de Adimplência</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-[200px] items-center justify-center text-center text-sm text-muted-foreground p-4">
                            Visualização de adimplência simplificada.
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
                    <CardTitle className="text-lg">Faturas (Competência: {selectedMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })})</CardTitle>
                </CardHeader>
                <CardContent>
                    <InvoicesTable data={filteredInvoices} />
                </CardContent>
            </Card>
        </div>
    );
}
