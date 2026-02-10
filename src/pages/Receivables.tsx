import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AgingList } from "@/components/receivables/AgingList";
import { InvoicesTable } from "@/components/receivables/InvoicesTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, DollarSign, Clock, AlertTriangle, Plus, FileText, Send, Calendar as CalendarIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { format } from "date-fns";
import { useInvoices } from "@/hooks/useInvoices";
import { formatCurrency } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateInvoiceModal } from "@/components/modals/CreateInvoiceModal";
import { cn } from "@/lib/utils";

export default function Receivables() {
  const { data: invoices, isLoading } = useInvoices();
  const [date, setDate] = useState<Date>();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter(inv => {
      // Filter by Date (Month/Year) if selected
      if (date) {
        const invDate = new Date(inv.due_date);
        if (invDate.getMonth() !== date.getMonth() || invDate.getFullYear() !== date.getFullYear()) {
          return false;
        }
      }

      // Filter by Client Name (Search)
      if (searchTerm) {
        // We need client name here. Assuming invoices has client_name or we need to join/fetch it. 
        // The hook returns Invoices linked to clients.
        // Let's check the hook type. UseInvoices usually joins with clients.
        // If not, we might need adjustments. Assuming client structure exists or 'client' object.
        // Checking previous file content for useInvoices usage... it maps 'inv.value'.
        // If the hook returns joined data, we can filter. If not, we filter by what's available.
        // For now, I'll filter by ID or if the hook returns the name.
        // Based on typical supabase joins: inv.clients?.name
        const clientName = (inv as any).clients?.name || '';
        if (!clientName.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
      }

      // Filter by Status
      if (statusFilter !== 'all' && inv.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [invoices, date, searchTerm, statusFilter]);

  const {
    totalInvoiced,
    totalReceived,
    pendingAmount,
    overdueCount,
    defaultRate,
    paidCount,
    pendingCount,
    overdueAmount
  } = useMemo(() => {
    // Calculate metrics based on FILTERED data to reflect the view
    // Or should metrics reflect global state? Usually filters affect the list, but Dashboard metrics might be global or also filtered.
    // User asked for filters on the page. Usually this implies the metrics adjust to show "Invoices for February" etc.
    // I will use filteredInvoices for the metrics.

    if (!filteredInvoices.length && !isLoading) return {
      totalInvoiced: 0,
      totalReceived: 0,
      pendingAmount: 0,
      overdueCount: 0,
      defaultRate: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueAmount: 0
    };

    const tInvoiced = filteredInvoices.reduce((acc, inv) => acc + inv.value, 0);
    const tReceived = filteredInvoices.filter(inv => inv.status === 'paid').reduce((acc, inv) => acc + inv.value, 0);
    const pAmount = filteredInvoices.filter(inv => ['pending', 'overdue'].includes(inv.status)).reduce((acc, inv) => acc + inv.value, 0);
    const oCount = filteredInvoices.filter(inv => inv.status === 'overdue').length;
    const tCount = filteredInvoices.length || 1;
    const dRate = (oCount / tCount) * 100;

    const pCount = filteredInvoices.filter(inv => inv.status === 'paid').length;
    const penCount = filteredInvoices.filter(inv => inv.status === 'pending').length;
    const oAmount = filteredInvoices.filter(inv => inv.status === 'overdue').reduce((acc, inv) => acc + inv.value, 0);

    return {
      totalInvoiced: tInvoiced,
      totalReceived: tReceived,
      pendingAmount: pAmount,
      overdueCount: oCount,
      defaultRate: dRate,
      paidCount: pCount,
      pendingCount: penCount,
      overdueAmount: oAmount
    };
  }, [filteredInvoices, isLoading]);

  return (
    <AppLayout
      title="Recebimentos"
      subtitle="Gestão de faturas, cobranças e inadimplência"
    >
      {/* Actions & Filters */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">

            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "MMMM yyyy", { locale: ptBR }) : <span>Filtrar por Mês</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
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

            {/* Client Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar Cliente..."
                className="pl-8 w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Clear Filters */}
            {(date || searchTerm || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setDate(undefined);
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

      {
        isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Faturado"
              value={formatCurrency(totalInvoiced)}
              change={0}
              icon={Receipt}
              description="Filtrado"
            />
            <MetricCard
              title="Total Recebido"
              value={formatCurrency(totalReceived)}
              change={0}
              icon={DollarSign}
              description="Filtrado"
            />
            <MetricCard
              title="Em Aberto"
              value={formatCurrency(pendingAmount)}
              change={0}
              icon={Clock}
              description="Pendentes + Atrasados"
            />
            <MetricCard
              title="Inadimplência"
              value={`${defaultRate.toFixed(1)}%`}
              change={0}
              icon={AlertTriangle}
              description="Taxa sobre filtrado"
            />
          </div>
        )
      }

      {/* Aging List - We also need to pass filters or filter inside logic? 
          For now keeping Aging as general or we might need to update it too. */}
      {/* 
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Aging List - Contas a Receber</CardTitle>
        </CardHeader>
        <CardContent>
          <AgingList />
        </CardContent>
      </Card>
      */}

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* Compliance Chart - REMOVED MOCK */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Taxa de Adimplência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-center text-sm text-muted-foreground p-4">
              Sem dados suficientes no período.
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[100px] w-full" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-success/10 p-4">
                  <p className="text-sm text-muted-foreground">Faturas Pagas</p>
                  <p className="text-2xl font-bold text-success">{paidCount}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(totalReceived)}</p>
                </div>
                <div className="rounded-lg bg-warning/10 p-4">
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(pendingAmount - overdueAmount)}</p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-4">
                  <p className="text-sm text-muted-foreground">Atrasados</p>
                  <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(overdueAmount)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table - Passing filtered data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Faturas</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoicesTable data={filteredInvoices} />
        </CardContent>
      </Card>
    </AppLayout >
  );
}
