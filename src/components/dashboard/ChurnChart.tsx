import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useFinancialHistory } from "@/hooks/useFinancialMetrics";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="mb-2 font-medium text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">
              {entry.name}:
            </span>
            <span className="font-mono text-sm font-medium text-foreground">
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ChurnChart() {
  const history = useFinancialHistory();

  if (!history || history.length === 0) {
    return (
      <div className="metric-card flex h-[350px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const data = history.map(metric => ({
    month: format(parseISO(metric.month), "MMM", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase()),
    churnRate: Number(metric.churnRate.toFixed(1)),
    // NRR (Net Revenue Retention)
    // Approximate NRR using available metrics
    // Gross Retention = 1 - (ChurnMRR / StartMRR)
    // Net Retention = (StartMRR - ChurnMRR + ExpansionMRR) / StartMRR
    // StartMRR approx = EndMRR - NewMRR + ChurnMRR - ExpansionMRR + ContractionMRR
    // Simplify: StartMRR = metric.mrr - metric.newMRR + metric.churnMRR (assuming 0 exp/cont)

    nrr: metric.mrr - metric.newMRR + metric.churnMRR > 0
      ? Number(((1 - (metric.churnMRR / (metric.mrr - metric.newMRR + metric.churnMRR))) * 100).toFixed(1))
      : 100
  }));

  return (
    <div className="metric-card animate-slide-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Churn & Retenção
          </h3>
          <p className="text-sm text-muted-foreground">
            Taxa de churn mensal e Net Revenue Retention
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-sm text-muted-foreground">Churn Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">NRR</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 'auto']}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              domain={[80, 120]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="churnRate"
              name="Churn Rate"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--destructive))", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="nrr"
              name="NRR"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--success))", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
