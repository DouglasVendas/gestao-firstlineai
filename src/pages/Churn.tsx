import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, TrendingDown, RefreshCw, Shield, AlertTriangle, Loader2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useFinancialData } from "@/contexts/FinancialContext";
import { useFinancialSnapshot, useFinancialHistory } from "@/hooks/useFinancialMetrics";
import { isSameMonth, parseISO, startOfMonth } from "date-fns";

export default function Churn() {
  const { clients, selectedMonth, isLoading: isLoadingData } = useFinancialData();
  const { current, isLoading: isLoadingSnapshot } = useFinancialSnapshot();
  const history = useFinancialHistory();

  // Dynamic Cohort Analysis Calculation
  const cohortData = useMemo(() => {
    if (!clients) return [];

    // Group clients by start month (Cohort)
    const cohorts: Record<string, { total: number; retained: Record<number, number> }> = {};

    clients.forEach(client => {
      const startDateStr = client.start_date || client.created_at;
      if (!startDateStr) return;

      const startDate = new Date(startDateStr);
      const cohortKey = startDate.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }); // e.g., "jan. 2024"

      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = { total: 0, retained: {} };
      }

      cohorts[cohortKey].total++;

      // Calculate retention for months 1, 3, 6, 12
      // Logic: A client is retained in month X if they are active OR if they churned AFTER month X
      const monthsSinceStart = (new Date().getFullYear() - startDate.getFullYear()) * 12 + (new Date().getMonth() - startDate.getMonth());
      const churnDate = client.churn_date ? new Date(client.churn_date) : null;
      const monthsUntilChurn = churnDate
        ? (churnDate.getFullYear() - startDate.getFullYear()) * 12 + (churnDate.getMonth() - startDate.getMonth())
        : Infinity;

      [1, 3, 6, 12].forEach(month => {
        // If enough time has passed to measure this month
        if (monthsSinceStart >= month) {
          // Check if they were still active at that month
          if (monthsUntilChurn >= month) {
            cohorts[cohortKey].retained[month] = (cohorts[cohortKey].retained[month] || 0) + 1;
          }
        }
      });
    });

    // Format for table
    return Object.entries(cohorts)
      .sort((a, b) => {
        // Sort by date from string is tricky, let's try to parse back or rely on order of insertion if chronological
        // A simple parse:
        const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const parsePTDate = (str: string) => {
          const [m, y] = str.split('. ');
          const mi = months.indexOf(m.toLowerCase());
          return new Date(parseInt(y), mi);
        };
        return parsePTDate(a[0]).getTime() - parsePTDate(b[0]).getTime();
      })
      .slice(-5)
      .map(([cohort, data]) => ({
        cohort,
        month1: Math.round((data.retained[1] / data.total) * 100) || null,
        month3: Math.round((data.retained[3] / data.total) * 100) || null,
        month6: Math.round((data.retained[6] / data.total) * 100) || null,
        month12: Math.round((data.retained[12] / data.total) * 100) || null,
      }));
  }, [clients]);


  const { churnEvolutionData, atRiskClients, cancellations, currentChurnRate, churnedRevenue, revenueChurnRate } = useMemo(() => {
    if (!history || !clients || !current) return {
      churnEvolutionData: [],
      atRiskClients: [],
      cancellations: [],
      currentChurnRate: 0,
      churnedRevenue: 0,
      revenueChurnRate: 0
    };

    // Transform metrics for chart
    const evolutionData = history.map(m => ({
      month: new Date(m.month + '-01').toLocaleString('pt-BR', { month: 'short' }),
      churnRate: m.churnRate,
      // We don't have historical Revenue Churn in simple history hook yet. 
      // For now, let's omit or approximate. 
      // Approximating that revenue churn follows client churn pattern for visualization:
      revenueChurn: m.churnRate // Placeholder
    }));

    // Clients at Risk - using Mock logic based on "Trial" expiring or similar?
    // Or just filter 'Trial' status clients who are close to end date?
    // User logic previously was empty.
    const atRisk: typeof clients = [];

    // Recent Cancellations (Global or Month?)
    // "Recent Cancellations" usually implies the latest ones.
    const cancelled = clients.filter(c => c.status === 'churned')
      .sort((a, b) => {
        const dateA = a.churn_date ? new Date(a.churn_date).getTime() : 0;
        const dateB = b.churn_date ? new Date(b.churn_date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);

    const currChurnRate = current.churnRate || 0;

    // Calculate Revenue Churn for the Selected Month
    // Revenue Churn = (MRR Lost in Month) / (Total MRR at Start of Month)
    const startOfSelectedMonth = startOfMonth(selectedMonth);

    const churnedInMonth = clients.filter(c =>
      c.churn_date && isSameMonth(parseISO(c.churn_date), selectedMonth)
    );
    const lostRev = churnedInMonth.reduce((acc, c) => acc + (c.mrr || 0), 0);

    // Total MRR at start: Active clients at start of month
    // Active if created before start and (churned after start or never)
    const activeAtStart = clients.filter(c => {
      const startDate = c.start_date ? new Date(c.start_date) : new Date(c.created_at);
      const churnDate = c.churn_date ? new Date(c.churn_date) : null;
      return startDate < startOfSelectedMonth && (!churnDate || churnDate >= startOfSelectedMonth);
    });
    const startMrr = activeAtStart.reduce((acc, c) => acc + (c.mrr || 0), 0);

    const revChurnRate = startMrr > 0 ? (lostRev / startMrr) * 100 : 0;

    return {
      churnEvolutionData: evolutionData,
      atRiskClients: atRisk,
      cancellations: cancelled,
      currentChurnRate: currChurnRate,
      churnedRevenue: lostRev,
      revenueChurnRate: revChurnRate
    };
  }, [history, clients, current, selectedMonth]);


  if (isLoadingData || isLoadingSnapshot || !current) {
    return (
      <AppLayout title="Churn & Retenção" subtitle="Análise de cancelamentos e retenção de clientes">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Churn & Retenção"
      subtitle="Análise de cancelamentos e retenção de clientes"
    >
      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Churn Rate (Clientes)"
          value={`${currentChurnRate.toFixed(1)}%`}
          change={0}
          icon={<Activity className="h-6 w-6" />}
          description="Mensal"
          variant={currentChurnRate > 5 ? "danger" : "default"}
        />
        <MetricCard
          title="Churn Rate (Receita)"
          value={`${revenueChurnRate.toFixed(1)}%`}
          change={0}
          icon={<TrendingDown className="h-6 w-6" />}
          description={`${formatCurrency(churnedRevenue)} perdidos este mês`}
          variant={revenueChurnRate > 5 ? "danger" : "default"}
        />
        <MetricCard
          title="NRR (Net Revenue Retention)"
          value="N/A"
          change={0}
          icon={<RefreshCw className="h-6 w-6" />}
          description="Dados insuficientes"
        />
        <MetricCard
          title="GRR (Gross Revenue Retention)"
          value="N/A"
          change={0}
          icon={<Shield className="h-6 w-6" />}
          description="Dados insuficientes"
        />
      </div>

      {/* At Risk Clients Alert */}
      {atRiskClients.length > 0 && (
        <Card className="mb-6 border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-warning">
              <AlertTriangle className="h-5 w-5" />
              Clientes em Risco ({atRiskClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atRiskClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between rounded-lg bg-background/50 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20 text-warning text-sm font-bold">
                      !
                    </div>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.plan?.name} • {formatCurrency(client.mrr)}/mês
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-warning border-warning/30">
                      Em Risco
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Churn Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução do Churn (Últimos 12 Meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {churnEvolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={churnEvolutionData}>
                    <defs>
                      <linearGradient id="churnGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="revenueChurnGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="churnRate"
                      name="Churn Clientes"
                      stroke="hsl(var(--destructive))"
                      fill="url(#churnGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Sem dados históricos.
                </div>
              )}

            </div>
          </CardContent>
        </Card>

        {/* Cohort Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análise de Cohort (Retenção %)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cohort</TableHead>
                    <TableHead className="text-center">Mês 1</TableHead>
                    <TableHead className="text-center">Mês 3</TableHead>
                    <TableHead className="text-center">Mês 6</TableHead>
                    <TableHead className="text-center">Mês 12</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cohortData.length > 0 ? cohortData.map((row) => (
                    <TableRow key={row.cohort}>
                      <TableCell className="font-medium">{row.cohort}</TableCell>
                      <TableCell className="text-center">
                        {row.month1 ? (
                          <span className="rounded bg-success/20 px-2 py-1 text-success">
                            {row.month1}%
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.month3 !== null ? (
                          <span className={cn(
                            "rounded px-2 py-1",
                            row.month3 >= 90 ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                          )}>
                            {row.month3}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.month6 !== null ? (
                          <span className={cn(
                            "rounded px-2 py-1",
                            row.month6 >= 85 ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                          )}>
                            {row.month6}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.month12 !== null ? (
                          <span className={cn(
                            "rounded px-2 py-1",
                            row.month12 >= 75 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                          )}>
                            {row.month12}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">Sem dados suficientes para Cohort.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancellations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cancelamentos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-right">MRR Perdido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cancellations.length > 0 ? cancellations.map((cancel) => (
                <TableRow key={cancel.id}>
                  <TableCell className="font-medium">{cancel.name}</TableCell>
                  <TableCell>{cancel.plan?.name || '-'}</TableCell>
                  <TableCell className="text-right text-destructive font-medium">
                    -{formatCurrency(cancel.mrr)}
                  </TableCell>
                  <TableCell>
                    {cancel.churn_date ? new Date(cancel.churn_date).toLocaleDateString("pt-BR") : '-'}
                  </TableCell>
                  <TableCell>{cancel.churn_reason || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={cancel.voluntary ? "secondary" : "destructive"}>
                      {cancel.voluntary === true ? "Voluntário" : cancel.voluntary === false ? "Involuntário" : "N/A"}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum cancelamento registrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
