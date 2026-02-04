import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface AgingBucket {
  label: string;
  range: string;
  value: number;
  count: number;
  color: string;
}

const agingData: AgingBucket[] = [
  { label: "Em dia", range: "0-30 dias", value: 285000, count: 45, color: "bg-success" },
  { label: "Atraso leve", range: "31-60 dias", value: 42000, count: 8, color: "bg-warning" },
  { label: "Atraso médio", range: "61-90 dias", value: 18500, count: 4, color: "bg-orange-500" },
  { label: "Atraso crítico", range: "90+ dias", value: 12300, count: 3, color: "bg-destructive" },
];

export function AgingList() {
  const total = agingData.reduce((acc, bucket) => acc + bucket.value, 0);

  return (
    <div className="space-y-4">
      {/* Visual bar */}
      <div className="flex h-4 overflow-hidden rounded-full">
        {agingData.map((bucket) => (
          <div
            key={bucket.label}
            className={cn("transition-all", bucket.color)}
            style={{ width: `${(bucket.value / total) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {agingData.map((bucket) => (
          <div
            key={bucket.label}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div className={cn("h-3 w-3 rounded-full", bucket.color)} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{bucket.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {bucket.count}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{bucket.range}</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(bucket.value)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
