import { TrendingUp, TrendingDown, Users, AlertCircle, PieChart, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardMetrics } from "@/hooks/useFinancialMetrics";

interface QuickStatsProps {
  current: DashboardMetrics;
  previous?: DashboardMetrics | null;
}

export function QuickStats({ current, previous }: QuickStatsProps) {

  const calculateChange = (curr: number, prev: number) => {
    if (!prev) return "+0.0";
    const diff = curr - prev;
    const prefix = diff >= 0 ? "+" : "";
    return `${prefix}${diff.toFixed(1)}`;
  };

  const calculatePctChange = (curr: number, prev: number) => {
    if (!prev) return "+0%";
    const diff = curr - prev; // Percentage points for percentages
    const prefix = diff >= 0 ? "+" : "";
    return `${prefix}${diff.toFixed(1)}%`;
  }

  const pQuickRatio = previous?.quickRatio || 0;
  const pRuleOf40 = previous?.ruleOf40 || 0;
  const pRisk = previous?.riskClients || 0;
  const pNPS = previous?.nps || 0;

  const stats = [
    {
      label: "Quick Ratio",
      value: current.quickRatio.toFixed(1),
      trend: current.quickRatio >= pQuickRatio ? "up" : "down" as "up" | "down",
      trendValue: calculateChange(current.quickRatio, pQuickRatio),
      icon: Activity,
      color: "success" as const,
      suffix: "x"
    },
    {
      label: "Rule of 40",
      value: `${current.ruleOf40.toFixed(0)}%`,
      trend: current.ruleOf40 >= pRuleOf40 ? "up" : "down" as "up" | "down",
      trendValue: calculatePctChange(current.ruleOf40, pRuleOf40),
      icon: PieChart,
      color: current.ruleOf40 >= 40 ? "success" as const : "warning" as const,
    },
    {
      label: "Clientes em Risco",
      value: current.riskClients.toString(),
      trend: current.riskClients <= pRisk ? "up" : "down" as "up" | "down", // Lower is better (up logic inverted visual?) No, usually trend up is green. Less risk is green.
      // If current < previous, it's GOOD. 
      // trendValue: -2. trend: "down". 
      // If "down" is red, we want "down" to be green here?
      // The component logic says: stat.trend === "down" && stat.color === "warning" ? "text-success" : ...
      trendValue: calculateChange(current.riskClients, pRisk),
      icon: AlertCircle,
      color: "warning" as const,
    },
    {
      trendValue: calculateChange(current.nps, pNPS),
      icon: Users,
      color: "primary" as const,
    },
    {
      label: "Runway (Caixa)",
      value: current.runway === Infinity ? "Positivo" : `${current.runway.toFixed(1)} meses`,
      trend: "up" as "up" | "down", // Placeholder, logic could be complex
      trendValue: "", // No trend for now
      icon: Activity,
      color: current.runway === Infinity || current.runway > 6 ? "success" as const : (current.runway < 3 ? "destructive" as const : "warning" as const),
    },
  ];

  return (
    <div className="metric-card animate-slide-up">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Indicadores Rápidos
      </h3>

      <div className="space-y-4">
        {stats.map((stat) => {
          // Custom logic to color the trend
          const isPositiveChange = stat.trend === "up";
          // For Risk, "down" trend (negative change) is GOOD (Green). "up" trend (positive change) is BAD (Red).
          // stat.color = "warning".
          // Logic below:
          // trend === "up" && "text-success" (Generic good)
          // trend === "down" && warning (Risk) -> "text-success" (Risk went down = Good)
          // trend === "down" -> "text-destructive" (Generic bad)
          // What if Risk went UP? trend="up". "text-success" ? WRONG.

          // Let's refine the specific visual logic inline or rely on props.
          let trendColor = "";
          if (stat.label === "Clientes em Risco") {
            const val = parseFloat(stat.trendValue);
            trendColor = val <= 0 ? "text-success" : "text-destructive";
          } else {
            trendColor = stat.trend === "up" ? "text-success" : "text-destructive";
          }

          const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;

          return (
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
                    stat.color === "warning" && "bg-warning/10 text-warning"
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

              {stat.trendValue && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    trendColor
                  )}
                >
                  <TrendIcon className="h-4 w-4" />
                  {stat.trendValue}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
