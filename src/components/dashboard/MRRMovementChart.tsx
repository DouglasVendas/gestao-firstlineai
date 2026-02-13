import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { useFinancialSnapshot } from "@/hooks/useFinancialMetrics";
import { Loader2 } from "lucide-react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

const getColor = (type: string) => {
  switch (type) {
    case "base":
      return "hsl(var(--muted-foreground))";
    case "positive":
      return "hsl(var(--success))";
    case "negative":
      return "hsl(var(--destructive))";
    case "total":
      return "hsl(var(--primary))";
    default:
      return "hsl(var(--muted-foreground))";
  }
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="mb-1 font-medium text-foreground">{data.name}</p>
        <p className="font-mono text-sm font-medium text-foreground">
          {formatCurrency(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

export function MRRMovementChart() {
  const { current, previous, isLoading } = useFinancialSnapshot();

  if (isLoading || !current) {
    return (
      <div className="metric-card flex h-[350px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate movements
  const startMRR = previous?.mrr || 0;
  const endMRR = current.mrr;
  const newMRR = current.newMRR || 0;
  const churnMRR = current.churnMRR || 0; // This should be positive value of lost revenue

  // Net expansion/contraction = (End - Start) - (New - Churn)
  // If ChurnMRR IS summed as positive number of lost MRR:
  // End = Start + New - Churn + Expansion
  // Expansion = End - Start - New + Churn
  const expansionNet = endMRR - startMRR - newMRR + churnMRR;

  const data = [
    { name: "MRR Inicial", value: startMRR, type: "base" },
    { name: "Novos Clientes", value: newMRR, type: "positive" },
    // If expansionNet is positive, show as Expansion. If negative, show as Contraction.
    ...(expansionNet >= 0
      ? [{ name: "Expansão", value: expansionNet, type: "positive" }]
      : [{ name: "Contração", value: expansionNet, type: "negative" }]
    ),
    { name: "Churn", value: -churnMRR, type: "negative" },
    { name: "MRR Final", value: endMRR, type: "total" },
  ];

  return (
    <div className="metric-card animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Movimento do MRR
        </h3>
        <p className="text-sm text-muted-foreground">
          Decomposição mensal da variação de receita recorrente
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-success" />
          <span className="text-sm text-muted-foreground">Crescimento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-destructive" />
          <span className="text-sm text-muted-foreground">Perdas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-primary" />
          <span className="text-sm text-muted-foreground">Total</span>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              horizontal={false}
            />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={formatCurrency}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent))" }} />
            <ReferenceLine x={0} stroke="hsl(var(--border))" />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.type)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
