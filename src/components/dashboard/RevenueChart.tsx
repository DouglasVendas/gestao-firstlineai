import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", mrr: 45000, arr: 540000 },
  { month: "Fev", mrr: 52000, arr: 624000 },
  { month: "Mar", mrr: 58000, arr: 696000 },
  { month: "Abr", mrr: 63000, arr: 756000 },
  { month: "Mai", mrr: 71000, arr: 852000 },
  { month: "Jun", mrr: 78000, arr: 936000 },
  { month: "Jul", mrr: 85000, arr: 1020000 },
  { month: "Ago", mrr: 92000, arr: 1104000 },
  { month: "Set", mrr: 98000, arr: 1176000 },
  { month: "Out", mrr: 105000, arr: 1260000 },
  { month: "Nov", mrr: 112000, arr: 1344000 },
  { month: "Dez", mrr: 124000, arr: 1488000 },
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
              {entry.name === "mrr" ? "MRR" : "ARR"}:
            </span>
            <span className="font-mono text-sm font-medium text-foreground">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueChart() {
  return (
    <div className="metric-card animate-slide-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Evolução de Receita
          </h3>
          <p className="text-sm text-muted-foreground">MRR e ARR mensal</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">MRR</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">ARR</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="colorArr" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--success))"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--success))"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
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
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="mrr"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorMrr)"
            />
            <Area
              type="monotone"
              dataKey="arr"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              fill="url(#colorArr)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
