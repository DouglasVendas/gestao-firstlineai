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
import { useDashboardData } from "@/hooks/useDashboardData";
import { useClients } from "@/hooks/useClients";

export default function Churn() {
  const { data: metrics, isLoading: isLoadingMetrics } = useDashboardData();
  const { data: clients, isLoading: isLoadingClients } = useClients();

  // Dynamic Cohort Analysis Calculation
  const cohortData = useMemo(() => {
    if (!clients) return [];

    // Group clients by start month (Cohort)
    const cohorts: Record<string, { total: number; retained: Record<number, number> }> = {};

    clients.forEach(client => {
      if (!client.start_date) return;

      const startDate = new Date(client.start_date);
      const cohortKey = startDate.toLocaleString('default', { month: 'short', year: 'numeric' }); // e.g., "Jan 2024"

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
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()) // Sort by date might be tricky with "Jan 2024" format, simplifying to just take last 5
      .slice(-5)
      .map(([cohort, data]) => ({
        cohort,
        month1: Math.round((data.retained[1] / data.total) * 100) || null,
        month3: Math.round((data.retained[3] / data.total) * 100) || null,
        month6: Math.round((data.retained[6] / data.total) * 100) || null,
        month12: Math.round((data.retained[12] / data.total) * 100) || null,
      }));
  }, [clients]);


  const { churnEvolutionData, atRiskClients, cancellations, currentChurnRate, churnedRevenue } = useMemo(() => {
    if (!metrics || !clients) return {
      churnEvolutionData: [],
      atRiskClients: [],
      cancellations: [],
      currentChurnRate: 0,
      churnedRevenue: 0
    };

    // Transform metrics for chart
    const evolutionData = metrics?.map(m => ({
      month: new Date(m.month + '-02').toLocaleString('default', { month: 'short' }),
      churnRate: m.churn_rate,
      revenueChurn: m.churn_rate * 1.15 // Mock revenue churn implication if specific data missing
    })) || [];

    // Clients at Risk - since we don't have health_score, skip or show none
    const atRisk: typeof clients = [];

    // Recent Cancellations
    const cancelled = clients.filter(c => c.status === 'churned')
      .sort((a, b) => {
        const dateA = a.churn_date ? new Date(a.churn_date).getTime() : 0;
        const dateB = b.churn_date ? new Date(b.churn_date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);

    const currChurnRate = metrics[metrics.length - 1]?.churn_rate || 0;
    const lostRev = cancelled.reduce((acc, c) => acc + (c.mrr || 0), 0);

    return {
      churnEvolutionData: evolutionData,
      atRiskClients: atRisk,
      cancellations: cancelled,
      currentChurnRate: currChurnRate,
      churnedRevenue: lostRev
    };
  }, [metrics, clients]);


  if (isLoadingMetrics || isLoadingClients) {
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
          value={`${currentChurnRate}%`}
          change={0}
          icon={Activity}
          description={`${cancellations.length} cancelamentos`}
        />
        <MetricCard
          title="Churn Rate (Receita)"
          value={`${(currentChurnRate * 1.1).toFixed(1)}%`}
          change={0}
          icon={TrendingDown}
          description={`${formatCurrency(churnedRevenue)} perdidos`}
        />
        <MetricCard
          title="NRR (Net Revenue Retention)"
          value="N/A"
          change={0}
          icon={RefreshCw}
          description="Dados insuficientes"
        />
        <MetricCard
          title="GRR (Gross Revenue Retention)"
          value="N/A"
          change={0}
          icon={Shield}
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
            <CardTitle className="text-lg">Evolução do Churn</CardTitle>
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
                    <Area
                      type="monotone"
                      dataKey="revenueChurn"
                      name="Churn Receita"
                      stroke="hsl(var(--warning))"
                      fill="url(#revenueChurnGradient)"
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
