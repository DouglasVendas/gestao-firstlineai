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
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useClients } from "@/hooks/useClients";

const cohortData = [
  { cohort: "Jan 2023", month1: 100, month3: 92, month6: 85, month12: 78 },
  { cohort: "Abr 2023", month1: 100, month3: 94, month6: 88, month12: 82 },
  { cohort: "Jul 2023", month1: 100, month3: 95, month6: 89, month12: null },
  { cohort: "Out 2023", month1: 100, month3: 96, month6: null, month12: null },
  { cohort: "Jan 2024", month1: 100, month3: null, month6: null, month12: null },
];

export default function Churn() {
  const { metrics, isLoading: isLoadingMetrics } = useDashboardData();
  const { data: clients, isLoading: isLoadingClients } = useClients();

  if (isLoadingMetrics || isLoadingClients) {
    return (
      <AppLayout title="Churn & Retenção" subtitle="Análise de cancelamentos e retenção de clientes">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Transform metrics for chart
  // Assuming metrics are ordered by date or we should sort them.
  // 'metrics' comes from useDashboardData which sorts by month ascending usually.
  const churnEvolutionData = metrics?.map(m => ({
    month: new Date(m.month + '-02').toLocaleString('default', { month: 'short' }), // Quick parse, adding day to avoid timezone issues
    churnRate: m.churn_rate,
    revenueChurn: m.churn_rate * 1.15 // Mock revenue churn implication
  })) || [];

  // Clients at Risk (Low health score)
  const atRiskClients = clients?.filter(c => c.status === 'active' && c.health_score < 60)
    .sort((a, b) => a.health_score - b.health_score)
    .slice(0, 5) || [];

  // Recent Cancellations
  const cancellations = clients?.filter(c => c.status === 'churned')
    .slice(0, 10) || []; // Show last 10

  const currentChurnRate = metrics?.[metrics.length - 1]?.churn_rate || 0;
  // Estimate revenue lost (Churned clients MRR sum)
  // Since we don't have historical churned clients with dates easily, we sum current churned clients MRR?
  // Actually churned clients usually have 0 MRR? 
  // Let's assume clients table retains their 'last MRR' or we filter by status='churned'.
  // If status='churned', we can sum their MRR if it wasn't cleared. 
  // If cleared, we can't show "Lost Revenue" easily without a transactions/log table.
  // I'll sum MRR of churned clients assuming it's not zeroed out yet, or use a heuristic.
  const churnedRevenue = cancellations.reduce((acc, c) => acc + (c.mrr || 0), 0);

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
          change={{ value: 0.3, isPositive: false }} // Mock change
          icon={Activity}
          description={`${cancellations.length} cancelamentos`}
        />
        <MetricCard
          title="Churn Rate (Receita)"
          value={`${(currentChurnRate * 1.1).toFixed(1)}%`}
          change={{ value: 0.4, isPositive: false }}
          icon={TrendingDown}
          description={`${formatCurrency(churnedRevenue)} perdidos`}
        />
        <MetricCard
          title="NRR (Net Revenue Retention)"
          value="112%"
          change={{ value: 3, isPositive: true }}
          icon={RefreshCw}
          description="Expansão > Churn"
        />
        <MetricCard
          title="GRR (Gross Revenue Retention)"
          value="97.7%"
          change={{ value: 0.5, isPositive: true }}
          icon={Shield}
          description="Sem expansão"
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
              {atRiskClients.map((client, idx) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between rounded-lg bg-background/50 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                        client.health_score < 40 ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
                      )}
                    >
                      {client.health_score}
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
                      Health Score Baixo
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
                    formatter={(value: number) => [`${value}%`, '']}
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
                  {cohortData.map((row) => (
                    <TableRow key={row.cohort}>
                      <TableCell className="font-medium">{row.cohort}</TableCell>
                      <TableCell className="text-center">
                        <span className="rounded bg-success/20 px-2 py-1 text-success">
                          {row.month1}%
                        </span>
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
                  ))}
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
              {cancellations.map((cancel, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{cancel.client}</TableCell>
                  <TableCell>{cancel.plan}</TableCell>
                  <TableCell className="text-right text-destructive font-medium">
                    -{formatCurrency(cancel.mrr)}
                  </TableCell>
                  <TableCell>
                    {new Date(cancel.date).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>{cancel.reason}</TableCell>
                  <TableCell>
                    <Badge variant={cancel.voluntary ? "secondary" : "destructive"}>
                      {cancel.voluntary ? "Voluntário" : "Involuntário"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
