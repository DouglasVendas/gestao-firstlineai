import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, TrendingUp, TrendingDown, DollarSign, Wallet, Filter, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
import { useTransactions } from "@/hooks/useTransactions";
import { useDashboardData } from "@/hooks/useDashboardData";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
};

export default function Cashflow() {
  const { data: transactions, isLoading: isLoadingTransactions } = useTransactions();
  const { data: metrics, isLoading: isLoadingMetrics } = useDashboardData();

  if (isLoadingTransactions || isLoadingMetrics) {
    return (
      <AppLayout title="Fluxo de Caixa" subtitle="Gestão de entradas, saídas e previsibilidade">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Transform metrics for charts
  const balanceEvolutionData = metrics?.map(m => ({
    month: new Date(m.month).toLocaleDateString('pt-BR', { month: 'short' }),
    saldo: m.revenue - m.expenses, // Simplified calculation
    entradas: m.revenue,
    saidas: m.expenses
  })) || [];

  // Calculate current month stats (assuming last metric is current)
  const currentMonth = metrics?.[metrics.length - 1] || { revenue: 0, expenses: 0 };
  const currentBalance = currentMonth.revenue - currentMonth.expenses; // Mock balance logic based on last month

  return (
    <AppLayout
      title="Fluxo de Caixa"
      subtitle="Gestão de entradas, saídas e previsibilidade"
    >
      {/* Actions Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Saldo Atual"
          value={formatCurrency(currentBalance)}
          change={{ value: 12.5, isPositive: true }}
          icon={Wallet}
          description="Estimado base mês atual"
        />
        <MetricCard
          title="Entradas (Mês)"
          value={formatCurrency(currentMonth.revenue)}
          change={{ value: 8.2, isPositive: true }}
          icon={TrendingUp}
          description="Receitas confirmadas"
        />
        <MetricCard
          title="Saídas (Mês)"
          value={formatCurrency(currentMonth.expenses)}
          change={{ value: -3.1, isPositive: false }}
          icon={TrendingDown}
          description="Despesas realizadas"
        />
        <MetricCard
          title="Previsão (30d)"
          value={formatCurrency(currentBalance * 1.1)} // Mock projection
          change={{ value: 5.4, isPositive: true }}
          icon={DollarSign}
          description="Fluxo projetado"
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Balance Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução do Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={balanceEvolutionData}>
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
            <CardTitle className="text-lg">Entradas vs Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={balanceEvolutionData}>
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

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions?.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      transaction.type === "entrada"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {transaction.type === "entrada" ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.category} • {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-semibold",
                      transaction.type === "entrada"
                        ? "text-success"
                        : "text-destructive"
                    )}
                  >
                    {transaction.type === "entrada" ? "+" : "-"}{" "}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.status === "completed" ? "Confirmado" : "Pendente"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
