import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Wallet, Download, Loader2, Calendar as CalendarIcon } from "lucide-react";
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
import { useFinancialData } from "@/contexts/FinancialContext"; // Unified Context
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

// Helper to unify data types into a "Transaction-like" structure for the list
interface CashflowItem {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: 'entrada' | 'saida';
  date: string;
  status: 'completed' | 'pending';
}

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
  const { invoices, fixedCosts, variableCosts, selectedMonth, setSelectedMonth, isLoading } = useFinancialData();

  const selectedMonthStr = useMemo(() => format(selectedMonth, 'yyyy-MM'), [selectedMonth]);

  // Unified List Calculation
  // We construct the cashflow list from Invoices (In) and Costs (Out) to ensure consistency with Dashboard.
  const cashflowItems = useMemo<CashflowItem[]>(() => {
    if (isLoading) return [];

    const items: CashflowItem[] = [];

    // 1. Invoices (Entradas)
    invoices.forEach(inv => {
      // Only include if it has a paid_date? Or check due_date?
      // "Real" cashflow usually means Paid. 
      // User said: "entradas e saídas reais (paid_date)"
      if (inv.status === 'paid' && inv.paid_date) {
        // Filter by global month here or do it later? 
        // Let's filter later to allow charts to potentially see history if we wanted, 
        // BUT for the list we usually show the selected month.
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
      // Assuming fixed costs apply if they correspond to the month
      if (fc.month) {
        items.push({
          id: `fc-${fc.id}`,
          description: fc.description,
          category: fc.category,
          amount: fc.actual,
          type: 'saida',
          date: `${fc.month}-01`, // Default to 1st of month if no specific day
          status: 'completed'
        });
      }
    });

    // 3. Variable Costs (Saídas)
    variableCosts.forEach(vc => {
      if (vc.month) {
        items.push({
          id: `vc-${vc.id}`,
          description: vc.description || vc.category,
          category: vc.category,
          amount: vc.amount,
          type: 'saida',
          date: `${vc.month}-01`,
          status: 'completed'
        });
      }
    });

    // Sort by date desc
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, fixedCosts, variableCosts, isLoading]);

  // Filter by Selected Month
  const currentMonthItems = useMemo(() => {
    return cashflowItems.filter(item => item.date.startsWith(selectedMonthStr));
  }, [cashflowItems, selectedMonthStr]);

  // Stats for the Cards
  const stats = useMemo(() => {
    const revenue = currentMonthItems.filter(i => i.type === 'entrada').reduce((acc, i) => acc + i.amount, 0);
    const expenses = currentMonthItems.filter(i => i.type === 'saida').reduce((acc, i) => acc + i.amount, 0);
    return {
      revenue,
      expenses,
      balance: revenue - expenses
    };
  }, [currentMonthItems]);

  // Chart Data (History)
  // We can aggregate cashflowItems by month
  // Or stick to current selection for now. 
  // Let's build a simple 6-month history from the full cashflowItems list
  const chartData = useMemo(() => {
    const map = new Map<string, { month: string, entradas: number, saidas: number, saldo: number }>();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selectedMonth);
      d.setMonth(d.getMonth() - i);
      const mStr = format(d, 'yyyy-MM');
      map.set(mStr, {
        month: format(d, 'MMM', { locale: ptBR }),
        entradas: 0,
        saidas: 0,
        saldo: 0
      });
    }

    cashflowItems.forEach(item => {
      const mStr = item.date.substring(0, 7);
      if (map.has(mStr)) {
        const entry = map.get(mStr)!;
        if (item.type === 'entrada') entry.entradas += item.amount;
        else entry.saidas += item.amount;
        entry.saldo = entry.entradas - entry.saidas;
      }
    });

    return Array.from(map.values());
  }, [cashflowItems, selectedMonth]);


  if (isLoading) {
    return (
      <AppLayout title="Fluxo de Caixa" subtitle="Gestão de entradas, saídas e previsibilidade">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Fluxo de Caixa"
      subtitle="Gestão de entradas, saídas e previsibilidade"
    >
      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Global Month Selector integration */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedMonth && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedMonth ? format(selectedMonth, "MMMM yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedMonth}
                onSelect={(d) => d && setSelectedMonth(d)}
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

      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Saldo do Período"
          value={formatCurrency(stats.balance)}
          change={0}
          icon={Wallet}
          description={`Referente a ${format(selectedMonth, 'MMMM', { locale: ptBR })}`}
          variant={stats.balance >= 0 ? "success" : "danger"}
        />
        <MetricCard
          title="Entradas"
          value={formatCurrency(stats.revenue)}
          change={0}
          icon={TrendingUp}
          description="Receitas do período"
          variant="success"
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
          title="Previsão (30d)"
          value={formatCurrency(stats.balance)} // Placeholder
          change={0}
          icon={DollarSign}
          description="Projeção baseada no saldo"
          variant="default"
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Balance Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução do Saldo (6 Meses)</CardTitle>
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
            <CardTitle className="text-lg">Entradas vs Saídas</CardTitle>
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
          <CardTitle className="text-lg">Transações {selectedMonth && `- ${format(selectedMonth, 'MMMM/yyyy', { locale: ptBR })}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 min-h-[400px]">
            {currentMonthItems.length > 0 ? (
              currentMonthItems.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
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
        </CardContent>
      </Card>
    </AppLayout>
  );
}
