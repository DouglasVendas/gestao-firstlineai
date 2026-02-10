import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, TrendingUp, TrendingDown, DollarSign, Wallet, Filter, Loader2, ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon } from "lucide-react";
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
import { CreateTransactionModal } from "@/components/modals/CreateTransactionModal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
};

const ITEMS_PER_PAGE = 5;

export default function Cashflow() {
  const { data: transactions, isLoading: isLoadingTransactions } = useTransactions();
  const { data: metrics, isLoading: isLoadingMetrics } = useDashboardData();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentPage, setCurrentPage] = useState(1);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!date) return transactions;
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
    });
  }, [transactions, date]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Metrics based on filtered data (or current month if filter selected, else global? usually strictly filtered)
  const currentStats = useMemo(() => {
    if (!filteredTransactions.length) return { revenue: 0, expenses: 0, balance: 0 };

    // If date is selected, we calculate from transactions of that month
    // If no date, we might show total or just last month. 
    // Default is current month via state init.

    const revenue = filteredTransactions.filter(t => t.type === 'entrada').reduce((acc, t) => acc + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'saida').reduce((acc, t) => acc + t.amount, 0);
    return {
      revenue,
      expenses,
      balance: revenue - expenses
    };
  }, [filteredTransactions]);


  if (isLoadingTransactions || isLoadingMetrics) {
    return (
      <AppLayout title="Fluxo de Caixa" subtitle="Gestão de entradas, saídas e previsibilidade">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Transform metrics for charts (Historical)
  // This likely comes from 'metrics' which is useDashboardData (aggregated). 
  // If we want to filter the chart by the selected date, we usually show the year context or just highlighted. 
  // For now leaving chart as 'Evolution' (Historical context).
  const balanceEvolutionData = metrics?.map(m => ({
    month: new Date(m.month).toLocaleDateString('pt-BR', { month: 'short' }),
    saldo: m.revenue - m.expenses,
    entradas: m.revenue,
    saidas: m.expenses
  })) || [];


  return (
    <AppLayout
      title="Fluxo de Caixa"
      subtitle="Gestão de entradas, saídas e previsibilidade"
    >
      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "MMMM yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { setDate(d); setCurrentPage(1); }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
        <CreateTransactionModal />
      </div>

      {/* Metric Cards - Updated to use calculated stats from filtered transactions */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Saldo do Período"
          value={formatCurrency(currentStats.balance)}
          change={0} // We'd need previous period comparison for this
          icon={Wallet}
          description={date ? `Referente a ${format(date, 'MMMM', { locale: ptBR })}` : "Total"}
        />
        <MetricCard
          title="Entradas"
          value={formatCurrency(currentStats.revenue)}
          change={0}
          icon={TrendingUp}
          description="Receitas do período"
        />
        <MetricCard
          title="Saídas"
          value={formatCurrency(currentStats.expenses)}
          change={0}
          icon={TrendingDown}
          description="Despesas do período"
        />
        <MetricCard
          title="Previsão (30d)"
          value={formatCurrency(currentStats.balance * 1.0)} // Just showing same for now or simple projection
          change={0}
          icon={DollarSign}
          description="Projeção baseada no saldo"
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
          <CardTitle className="text-lg">Transações {date && `- ${format(date, 'MMMM/yyyy', { locale: ptBR })}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 min-h-[400px]">
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((transaction) => (
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
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Nenhuma transação encontrada para este período.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={currentPage === i + 1}
                        onClick={() => handlePageChange(i + 1)}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
