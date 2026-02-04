import { TrendingUp, TrendingDown, Users, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickStat {
  label: string;
  value: string;
  trend?: "up" | "down";
  trendValue?: string;
  icon: React.ElementType;
  color: "primary" | "success" | "warning" | "danger";
}

const stats: QuickStat[] = [
  {
    label: "Quick Ratio",
    value: "4.2",
    trend: "up",
    trendValue: "+0.3",
    icon: TrendingUp,
    color: "success",
  },
  {
    label: "Rule of 40",
    value: "52%",
    trend: "up",
    trendValue: "+4%",
    icon: TrendingUp,
    color: "success",
  },
  {
    label: "Clientes em Risco",
    value: "8",
    trend: "down",
    trendValue: "-2",
    icon: AlertCircle,
    color: "warning",
  },
  {
    label: "NPS Score",
    value: "72",
    trend: "up",
    trendValue: "+5",
    icon: Users,
    color: "primary",
  },
];

export function QuickStats() {
  return (
    <div className="metric-card animate-slide-up">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Indicadores Rápidos
      </h3>

      <div className="space-y-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between rounded-lg bg-secondary/50 p-3"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  stat.color === "primary" && "bg-primary/10 text-primary",
                  stat.color === "success" && "bg-success/10 text-success",
                  stat.color === "warning" && "bg-warning/10 text-warning",
                  stat.color === "danger" && "bg-destructive/10 text-destructive"
                )}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="font-mono text-lg font-semibold text-foreground">
                  {stat.value}
                </p>
              </div>
            </div>

            {stat.trend && stat.trendValue && (
              <span
                className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  stat.trend === "up" && "text-success",
                  stat.trend === "down" && stat.color === "warning"
                    ? "text-success"
                    : stat.trend === "down"
                    ? "text-destructive"
                    : ""
                )}
              >
                {stat.trend === "up" ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {stat.trendValue}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
