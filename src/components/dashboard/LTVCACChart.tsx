import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useFinancialHistory } from "@/hooks/useFinancialMetrics";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

export function LTVCACChart() {
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
    ltv: itemValue(metric.ltv),
    cac: itemValue(metric.cac),
    ratio: Number(metric.ratio)
  }));

  function itemValue(val: number) {
    return Number(val.toFixed(0));
  }

  return (
    <div className="metric-card animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">LTV vs CAC</h3>
        <p className="text-sm text-muted-foreground">
          Relação entre valor do cliente e custo de aquisição
        </p>
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
              dy={10}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `R$${value}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              unit="x"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number, name: string) => {
                if (name === "Ratio") return [`${value}x`, name];
                return [
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(value),
                  name.toUpperCase(),
                ];
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar
              yAxisId="left"
              dataKey="ltv"
              name="LTV"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              yAxisId="left"
              dataKey="cac"
              name="CAC"
              fill="hsl(var(--destructive))"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ratio"
              name="Ratio"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--success))", r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
