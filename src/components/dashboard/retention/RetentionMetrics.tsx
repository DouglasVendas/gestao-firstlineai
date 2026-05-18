import { useMemo } from "react";
import { useFinancialData } from "@/contexts/FinancialContext";
import { DashboardMetrics } from "@/hooks/useFinancialMetrics";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Activity, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { formatClientName } from "@/lib/clientNames";
import { startOfMonth, isSameMonth, parseISO } from "date-fns";

interface RetentionMetricsProps {
    currentMetric: DashboardMetrics;
    history: DashboardMetrics[];
}

export function RetentionMetrics({ currentMetric, history }: RetentionMetricsProps) {
    const { clients, selectedMonth } = useFinancialData();

    // 1. Cohort Analysis Logic
    const cohortData = useMemo(() => {
        if (!clients) return [];
        const cohorts: Record<string, { total: number; retained: Record<number, number> }> = {};

        clients.forEach(client => {
            const startDateStr = client.start_date || client.created_at;
            if (!startDateStr) return;

            const startDate = new Date(startDateStr);
            const cohortKey = startDate.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });

            if (!cohorts[cohortKey]) {
                cohorts[cohortKey] = { total: 0, retained: {} };
            }
            cohorts[cohortKey].total++;

            const monthsSinceStart = (new Date().getFullYear() - startDate.getFullYear()) * 12 + (new Date().getMonth() - startDate.getMonth());
            const churnDate = client.churn_date ? new Date(client.churn_date) : null;
            const monthsUntilChurn = churnDate
                ? (churnDate.getFullYear() - startDate.getFullYear()) * 12 + (churnDate.getMonth() - startDate.getMonth())
                : Infinity;

            [1, 3, 6, 12].forEach(month => {
                if (monthsSinceStart >= month) {
                    if (monthsUntilChurn >= month) {
                        cohorts[cohortKey].retained[month] = (cohorts[cohortKey].retained[month] || 0) + 1;
                    }
                }
            });
        });

        // Simplified sorting via predefined array
        const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const parsePTDate = (str: string) => {
            const [m, y] = str.split('. ');
            const mi = months.indexOf(m.toLowerCase());
            return new Date(parseInt(y), mi);
        };

        return Object.entries(cohorts)
            .sort((a, b) => parsePTDate(a[0]).getTime() - parsePTDate(b[0]).getTime())
            .slice(-5)
            .map(([cohort, data]) => ({
                cohort,
                month1: Math.round((data.retained[1] / data.total) * 100) || null,
                month3: Math.round((data.retained[3] / data.total) * 100) || null,
                month6: Math.round((data.retained[6] / data.total) * 100) || null,
                month12: Math.round((data.retained[12] / data.total) * 100) || null,
            }));
    }, [clients]);

    // 2. Churn Evolution & Stats
    const { churnEvolutionData, cancellations, revenueChurnRate, churnedRevenue } = useMemo(() => {
        if (!history || !clients || !currentMetric) return {
            churnEvolutionData: [], cancellations: [], revenueChurnRate: 0, churnedRevenue: 0
        };

        const evolutionData = history.map(m => ({
            month: new Date(m.month + '-01').toLocaleString('pt-BR', { month: 'short' }),
            churnRate: m.churnRate
        }));

        const cancelled = clients.filter(c => c.status === 'churned')
            .sort((a, b) => {
                const dateA = a.churn_date ? new Date(a.churn_date).getTime() : 0;
                const dateB = b.churn_date ? new Date(b.churn_date).getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, 10);

        // Revenue Churn Calculation (Selected Month)
        const startOfSelectedMonth = startOfMonth(selectedMonth);
        const churnedInMonth = clients.filter(c =>
            c.churn_date && isSameMonth(parseISO(c.churn_date), selectedMonth)
        );
        const lostRev = churnedInMonth.reduce((acc, c) => acc + (c.mrr || 0), 0);

        const activeAtStart = clients.filter(c => {
            const startDate = c.start_date ? new Date(c.start_date) : new Date(c.created_at);
            const churnDate = c.churn_date ? new Date(c.churn_date) : null;
            return startDate < startOfSelectedMonth && (!churnDate || churnDate >= startOfSelectedMonth);
        });
        const startMrr = activeAtStart.reduce((acc, c) => acc + (c.mrr || 0), 0);
        const revChurnRate = startMrr > 0 ? (lostRev / startMrr) * 100 : 0;

        return {
            churnEvolutionData: evolutionData,
            cancellations: cancelled,
            revenueChurnRate: revChurnRate,
            churnedRevenue: lostRev
        };
    }, [history, clients, currentMetric, selectedMonth]);

    return (
        <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Churn Rate (Clientes)" value={`${currentMetric.churnRate.toFixed(1)}%`} change={0} icon={<Activity className="h-6 w-6" />} variant={currentMetric.churnRate > 5 ? "danger" : "default"} />
                <MetricCard title="Churn Rate (Receita)" value={`${revenueChurnRate.toFixed(1)}%`} change={0} icon={<TrendingDown className="h-6 w-6" />} description={`${formatCurrency(churnedRevenue)} perdidos`} variant={revenueChurnRate > 5 ? "danger" : "default"} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="text-lg">Evolução do Churn</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={churnEvolutionData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}%`} />
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px" }} formatter={(val: number) => [`${val.toFixed(1)}%`, 'Churn Rate']} />
                                    <Area type="monotone" dataKey="churnRate" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-lg">Análise de Cohort</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cohort</TableHead>
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
                                            {row.month3 ? <span className={cn("rounded px-2 py-1", row.month3 >= 90 ? "bg-success/20 text-success" : "bg-warning/20 text-warning")}>{row.month3}%</span> : "-"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {row.month6 ? <span className={cn("rounded px-2 py-1", row.month6 >= 85 ? "bg-success/20 text-success" : "bg-warning/20 text-warning")}>{row.month6}%</span> : "-"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {row.month12 ? <span className={cn("rounded px-2 py-1", row.month12 >= 75 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive")}>{row.month12}%</span> : "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-lg">Cancelamentos Recentes</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Plano</TableHead><TableHead>MRR</TableHead><TableHead>Motivo</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {cancellations.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-medium">{formatClientName(c.name)}</TableCell>
                                    <TableCell>{c.plan?.name}</TableCell>
                                    <TableCell className="text-destructive">-{formatCurrency(c.mrr)}</TableCell>
                                    <TableCell>{c.churn_reason || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
