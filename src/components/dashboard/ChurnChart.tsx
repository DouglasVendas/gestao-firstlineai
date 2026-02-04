import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", churnRate: 3.2, nrr: 105 },
  { month: "Fev", churnRate: 2.8, nrr: 108 },
  { month: "Mar", churnRate: 3.5, nrr: 102 },
  { month: "Abr", churnRate: 2.9, nrr: 110 },
  { month: "Mai", churnRate: 2.4, nrr: 112 },
  { month: "Jun", churnRate: 2.1, nrr: 115 },
  { month: "Jul", churnRate: 2.6, nrr: 111 },
  { month: "Ago", churnRate: 2.2, nrr: 118 },
  { month: "Set", churnRate: 1.9, nrr: 120 },
  { month: "Out", churnRate: 2.3, nrr: 116 },
  { month: "Nov", churnRate: 1.8, nrr: 122 },
  { month: "Dez", churnRate: 1.5, nrr: 125 },
];

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
              {entry.dataKey === "churnRate" ? "Churn Rate" : "NRR"}:
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
              domain={[0, 5]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              domain={[90, 130]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="churnRate"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--destructive))", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="nrr"
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
