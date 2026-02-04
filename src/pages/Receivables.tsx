import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AgingList } from "@/components/receivables/AgingList";
import { InvoicesTable } from "@/components/receivables/InvoicesTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, DollarSign, Clock, AlertTriangle, Plus, FileText, Send } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useInvoices } from "@/hooks/useInvoices";
import { formatCurrency } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

// Mock compliance trend as history isn't stored in invoices table
const complianceData = [
  { month: "Jul", rate: 94.2 },
  { month: "Ago", rate: 95.1 },
  { month: "Set", rate: 93.8 },
  { month: "Out", rate: 96.2 },
  { month: "Nov", rate: 95.5 },
  { month: "Dez", rate: 94.8 },
  { month: "Jan", rate: 96.5 },
];

export default function Receivables() {
  const { data: invoices, isLoading } = useInvoices();

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
    if (!invoices) return {
      totalInvoiced: 0,
      totalReceived: 0,
      pendingAmount: 0,
      overdueCount: 0,
      defaultRate: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueAmount: 0
    };

    const tInvoiced = invoices.reduce((acc, inv) => acc + inv.value, 0);
    const tReceived = invoices.filter(inv => inv.status === 'paid').reduce((acc, inv) => acc + inv.value, 0);
    const pAmount = invoices.filter(inv => ['pending', 'overdue'].includes(inv.status)).reduce((acc, inv) => acc + inv.value, 0);
    const oCount = invoices.filter(inv => inv.status === 'overdue').length;
    const tCount = invoices.length || 1;
    const dRate = (oCount / tCount) * 100;

    const pCount = invoices.filter(inv => inv.status === 'paid').length;
    const penCount = invoices.filter(inv => inv.status === 'pending').length;
    const oAmount = invoices.filter(inv => inv.status === 'overdue').reduce((acc, inv) => acc + inv.value, 0);

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
  }, [invoices]);

  if (isLoading) {
    return (
      <AppLayout title="Recebimentos" subtitle="Gestão de faturas, cobranças e inadimplência">
        <div className="space-y-4">
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Recebimentos"
      subtitle="Gestão de faturas, cobranças e inadimplência"
    >
      {/* Actions */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Fatura
        </Button>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Gerar Relatório
        </Button>
        <Button variant="outline">
          <Send className="mr-2 h-4 w-4" />
          Enviar Cobranças em Lote
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Faturado"
          value={formatCurrency(totalInvoiced)}
          change={{ value: 8.2, isPositive: true }}
          icon={Receipt}
          description="Total listado"
        />
        <MetricCard
          title="Total Recebido"
          value={formatCurrency(totalReceived)}
          change={{ value: 12.5, isPositive: true }}
          icon={DollarSign}
          description="Faturas pagas"
        />
        <MetricCard
          title="Em Aberto"
          value={formatCurrency(pendingAmount)}
          change={{ value: 3.2, isPositive: false }}
          icon={Clock}
          description="Pendentes + Atrasados"
        />
        <MetricCard
          title="Inadimplência"
          value={`${defaultRate.toFixed(1)}%`}
          change={{ value: 0.8, isPositive: true }}
          icon={AlertTriangle}
          description="Taxa atual"
        />
      </div>

      {/* Aging List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Aging List - Contas a Receber</CardTitle>
        </CardHeader>
        <CardContent>
          <AgingList />
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* Compliance Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Taxa de Adimplência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={complianceData}>
                  <defs>
                    <linearGradient id="complianceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis domain={[90, 100]} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Adimplência']}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="hsl(var(--success))"
                    fill="url(#complianceGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Faturas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoicesTable />
        </CardContent>
      </Card>
    </AppLayout>
  );
}
