import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";

const data = [
  { month: "Jan", ltv: 15000, cac: 4500, ratio: 3.3 },
  { month: "Fev", ltv: 16200, cac: 4200, ratio: 3.9 },
  { month: "Mar", ltv: 17500, cac: 4800, ratio: 3.6 },
  { month: "Abr", ltv: 18200, cac: 4100, ratio: 4.4 },
  { month: "Mai", ltv: 19800, cac: 4300, ratio: 4.6 },
  { month: "Jun", ltv: 21000, cac: 4000, ratio: 5.3 },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

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
              {entry.dataKey === "ltv"
                ? "LTV"
                : entry.dataKey === "cac"
                ? "CAC"
                : "Ratio"}
              :
            </span>
            <span className="font-mono text-sm font-medium text-foreground">
              {entry.dataKey === "ratio"
                ? `${entry.value.toFixed(1)}x`
                : formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function LTVCACChart() {
  return (
    <div className="metric-card animate-slide-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">LTV vs CAC</h3>
          <p className="text-sm text-muted-foreground">
            Lifetime Value, Customer Acquisition Cost e proporção
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">LTV</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-warning" />
            <span className="text-sm text-muted-foreground">CAC</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">Ratio</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
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
              tickFormatter={formatCurrency}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `${value}x`}
              domain={[0, 8]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              yAxisId="left"
              dataKey="ltv"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="cac"
              fill="hsl(var(--warning))"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ratio"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--success))", strokeWidth: 0, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-success/10 p-3">
        <span className="text-sm text-muted-foreground">Ratio atual:</span>
        <span className="font-mono text-lg font-semibold text-success">
          5.3x
        </span>
        <span className="text-sm text-success">• Saudável (ideal: {">"} 3x)</span>
      </div>
    </div>
  );
}
