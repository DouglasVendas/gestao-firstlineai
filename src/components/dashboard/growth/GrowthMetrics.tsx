import { useMemo } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DollarSign, BarChart3, Users, TrendingUp, Zap, Target, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { useFinancialData } from "@/contexts/FinancialContext";
import { DashboardMetrics } from "@/hooks/useFinancialMetrics";
import { Badge } from "@/components/ui/badge";
import { LtvCacSimulator } from "./LtvCacSimulator"; // Separate component to keep this clean

interface GrowthMetricsProps {
    currentMetric: DashboardMetrics;
    history: DashboardMetrics[];
}

export function GrowthMetrics({ currentMetric, history }: GrowthMetricsProps) {
    const { clients } = useFinancialData();
    // We can calculate derived metrics here or pass them as props.
    // Let's keep logic close to presentation as much as possible, or recreate the useMemo from Metrics.tsx.

    const {
        netNewMrr,
        arpu,
        arpuChange,
        growthRate,
        mrrData,
        ltvCacTrendData
    } = useMemo(() => {
        // ... Copy logic from Metrics.tsx and LtvCac.tsx ...
        if (!history || history.length === 0 || !currentMetric) return {
            netNewMrr: 0, arpu: 0, arpuChange: 0, growthRate: 0, mrrData: [], ltvCacTrendData: []
        };

        const sortedHistory = [...history].sort((a, b) => a.month.localeCompare(b.month));
        const currIndex = sortedHistory.findIndex(h => h.month === currentMetric.month);
        const curr = currIndex >= 0 ? sortedHistory[currIndex] : sortedHistory[sortedHistory.length - 1];
        const prev = currIndex >= 1 ? sortedHistory[currIndex - 1] : (sortedHistory.length > 1 ? sortedHistory[sortedHistory.length - 2] : { mrr: 0, activeClients: 0 });

        const netNew = curr.mrr - prev.mrr;
        const currArpu = curr.activeClients > 0 ? curr.mrr / curr.activeClients : 0;
        const prevArpu = prev.activeClients > 0 ? prev.mrr / prev.activeClients : 0;
        const arpuChg = prevArpu > 0 ? ((currArpu - prevArpu) / prevArpu) * 100 : 0;
        const growth = prev.mrr > 0 ? ((curr.mrr - prev.mrr) / prev.mrr) * 100 : 0;

        const chartData = sortedHistory.map((m, i) => {
            const p = sortedHistory[i - 1] || { mrr: 0 };
            const diff = m.mrr - p.mrr;
            return {
                month: new Date(m.month + '-02').toLocaleString('pt-BR', { month: 'short' }),
                new: diff > 0 ? diff : 0,
                churn: diff < 0 ? Math.abs(diff) : 0
            };
        });

        const trendData = sortedHistory.map(h => ({
            month: new Date(h.month + '-01').toLocaleString('pt-BR', { month: 'short' }),
            ltv: Math.round(h.ltv),
            cac: Math.round(h.cac),
            ratio: h.cac > 0 ? Number((h.ltv / h.cac).toFixed(2)) : 0
        }));

        return {
            netNewMrr: netNew,
            arpu: currArpu,
            arpuChange: arpuChg,
            growthRate: growth,
            mrrData: chartData,
            ltvCacTrendData: trendData
        };
    }, [history, currentMetric]);

    const planDistribution = useMemo(() => {
        if (!clients) return [];
        const stats = clients.reduce((acc, client) => {
            if (client.status === 'churned') return acc;
            const planName = client.plan?.name || "Outros";
            acc[planName] = (acc[planName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const total = Object.values(stats).reduce((a, b) => a + b, 0) || 1;
        return Object.entries(stats).map(([name, count], index) => ({
            name,
            value: Math.round((count / total) * 100),
            color: `hsl(var(--chart-${index + 1}))`
        }));
    }, [clients]);

    // Advanced metrics
    const cac = currentMetric?.cac || 0;
    const ltv = currentMetric?.ltv || 0;
    const ltvCacRatio = currentMetric?.ratio || 0;
    const paybackPeriod = currentMetric?.paybackTerm || 0;

    return (
        <div className="space-y-8">
            {/* Revenue Metrics Row */}
            <section>
                <h2 className="mb-4 text-lg font-semibold text-foreground">Métricas de Receita & Eficiência</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard title="MRR Total" value={formatCurrency(currentMetric.mrr)} change={growthRate} icon={<DollarSign className="h-6 w-6" />} />
                    <MetricCard title="ARR" value={formatCurrency(currentMetric.arr)} change={growthRate} icon={<BarChart3 className="h-6 w-6" />} variant="success" />
                    <MetricCard title="ARPU" value={formatCurrency(arpu)} change={arpuChange} icon={<Users className="h-6 w-6" />} />
                    <MetricCard title="Net New MRR" value={formatCurrency(netNewMrr)} change={growthRate} icon={<TrendingUp className="h-6 w-6" />} variant="success" />
                </div>
            </section>

            {/* Charts Row 1: MRR Components + Plan Distribution */}
            <section className="grid gap-6 lg:grid-cols-3">
                <div className="metric-card lg:col-span-2">
                    <h3 className="mb-4 text-lg font-semibold">Componentes do MRR (Growth)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mrrData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(val) => new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(val)} />
                                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px" }} formatter={(val: number) => formatCurrency(val)} />
                                <Area type="monotone" dataKey="new" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="Novo MRR" />
                                <Area type="monotone" dataKey="churn" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.6} name="Churn" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="metric-card">
                    <h3 className="mb-4 text-lg font-semibold">Distribuição por Plano</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                                    {planDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                        {planDistribution.map((plan) => (
                            <div key={plan.name} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: plan.color }} /><span>{plan.name}</span></div>
                                <span className="font-mono font-medium">{plan.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* LTV & CAC Section */}
            <section>
                <h2 className="mb-4 text-lg font-semibold">Unit Economics (LTV & CAC)</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                    <MetricCard title="LTV" value={formatCurrency(ltv)} change={0} icon={<DollarSign className="h-6 w-6" />} />
                    <MetricCard title="CAC" value={formatCurrency(cac)} change={0} icon={<Target className="h-6 w-6" />} />
                    <MetricCard title="LTV:CAC Ratio" value={`${ltvCacRatio.toFixed(1)}x`} change={0} changeLabel="ideal > 3x" icon={<BarChart3 className="h-6 w-6" />} variant={ltvCacRatio >= 3 ? "success" : "warning"} />
                    <MetricCard title="Payback" value={`${paybackPeriod.toFixed(1)} meses`} change={0} changeLabel="ideal < 12 meses" icon={<Clock className="h-6 w-6" />} variant={paybackPeriod <= 12 ? "success" : "warning"} />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="lg:col-span-2">
                        <CardHeader><CardTitle className="text-lg">Evolução LTV vs CAC</CardTitle></CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={ltvCacTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                        <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                                        <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px" }} />
                                        <Legend />
                                        <Line yAxisId="left" type="monotone" dataKey="ltv" name="LTV" stroke="hsl(var(--success))" strokeWidth={2} />
                                        <Line yAxisId="left" type="monotone" dataKey="cac" name="CAC" stroke="hsl(var(--destructive))" strokeWidth={2} />
                                        <Line yAxisId="right" type="monotone" dataKey="ratio" name="Ratio" stroke="hsl(var(--primary))" strokeDasharray="5 5" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Simulator Section */}
            <section>
                <LtvCacSimulator baseLTV={ltv} baseCAC={cac} />
            </section>
        </div>
    );
}
