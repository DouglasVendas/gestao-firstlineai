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
import { Activity, TrendingDown, RefreshCw, Shield, AlertTriangle } from "lucide-react";
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

const churnEvolutionData = [
  { month: "Jul", churnRate: 2.8, revenueChurn: 3.2 },
  { month: "Ago", churnRate: 2.5, revenueChurn: 2.8 },
  { month: "Set", churnRate: 3.1, revenueChurn: 3.5 },
  { month: "Out", churnRate: 2.9, revenueChurn: 3.1 },
  { month: "Nov", churnRate: 2.4, revenueChurn: 2.6 },
  { month: "Dez", churnRate: 2.2, revenueChurn: 2.4 },
  { month: "Jan", churnRate: 2.1, revenueChurn: 2.3 },
];

const cohortData = [
  { cohort: "Jan 2023", month1: 100, month3: 92, month6: 85, month12: 78 },
  { cohort: "Abr 2023", month1: 100, month3: 94, month6: 88, month12: 82 },
  { cohort: "Jul 2023", month1: 100, month3: 95, month6: 89, month12: null },
  { cohort: "Out 2023", month1: 100, month3: 96, month6: null, month12: null },
  { cohort: "Jan 2024", month1: 100, month3: null, month6: null, month12: null },
];

const cancellations = [
  { client: "Old Tech Corp", plan: "Pro", mrr: 890, date: "2024-01-15", reason: "Migração para concorrente", voluntary: true },
  { client: "Startup ABC", plan: "Básico", mrr: 299, date: "2024-01-12", reason: "Fechou a empresa", voluntary: true },
  { client: "Digital XYZ", plan: "Pro", mrr: 890, date: "2024-01-10", reason: "Inadimplência", voluntary: false },
  { client: "Cloud Services", plan: "Enterprise", mrr: 4500, date: "2024-01-08", reason: "Budget cuts", voluntary: true },
  { client: "Data Corp", plan: "Básico", mrr: 299, date: "2024-01-05", reason: "Não viu valor", voluntary: true },
];

const atRiskClients = [
  { client: "Tech Solutions", plan: "Enterprise", mrr: 4500, healthScore: 35, lastLogin: "15 dias atrás", issues: ["Baixo uso", "Ticket aberto"] },
  { client: "Fintech Brasil", plan: "Pro", mrr: 890, healthScore: 42, lastLogin: "12 dias atrás", issues: ["Downgrade solicitado"] },
  { client: "Innovation Hub", plan: "Pro", mrr: 890, healthScore: 48, lastLogin: "8 dias atrás", issues: ["Reclamação NPS"] },
];

export default function Churn() {
  return (
    <AppLayout
      title="Churn & Retenção"
      subtitle="Análise de cancelamentos e retenção de clientes"
    >
      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Churn Rate (Clientes)"
          value="2.1%"
          change={{ value: 0.3, isPositive: true }}
          icon={Activity}
          description="3 cancelamentos"
        />
        <MetricCard
          title="Churn Rate (Receita)"
          value="2.3%"
          change={{ value: 0.4, isPositive: true }}
          icon={TrendingDown}
          description="R$ 7.268 perdidos"
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
                key={idx}
                className="flex items-center justify-between rounded-lg bg-background/50 p-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                      client.healthScore < 40 ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
                    )}
                  >
                    {client.healthScore}
                  </div>
                  <div>
                    <p className="font-medium">{client.client}</p>
                    <p className="text-sm text-muted-foreground">
                      {client.plan} • {formatCurrency(client.mrr)}/mês • Último login: {client.lastLogin}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {client.issues.map((issue, i) => (
                    <Badge key={i} variant="outline" className="text-warning border-warning/30">
                      {issue}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
