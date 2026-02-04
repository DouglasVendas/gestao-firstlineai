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
          value="R$ 357.800"
          change={{ value: 8.2, isPositive: true }}
          icon={Receipt}
          description="Últimos 30 dias"
        />
        <MetricCard
          title="Total Recebido"
          value="R$ 315.500"
          change={{ value: 12.5, isPositive: true }}
          icon={DollarSign}
          description="Últimos 30 dias"
        />
        <MetricCard
          title="Em Aberto"
          value="R$ 72.800"
          change={{ value: 3.2, isPositive: false }}
          icon={Clock}
          description="Pendentes + Atrasados"
        />
        <MetricCard
          title="Inadimplência"
          value="3.5%"
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
            <CardTitle className="text-lg">Resumo do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-success/10 p-4">
                <p className="text-sm text-muted-foreground">Faturas Pagas</p>
                <p className="text-2xl font-bold text-success">82</p>
                <p className="text-xs text-muted-foreground">R$ 285.000</p>
              </div>
              <div className="rounded-lg bg-warning/10 p-4">
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-warning">15</p>
                <p className="text-xs text-muted-foreground">R$ 42.300</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-4">
                <p className="text-sm text-muted-foreground">Atrasados</p>
                <p className="text-2xl font-bold text-destructive">7</p>
                <p className="text-xs text-muted-foreground">R$ 30.500</p>
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
