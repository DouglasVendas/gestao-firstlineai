import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel = "vs. mês anterior",
  icon,
  variant = "default",
}: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const isNeutral = change === 0;

  return (
    <div className="metric-card glow-border animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="metric-label">{title}</p>
          <p className="metric-value font-mono">{value}</p>
          
          {change !== undefined && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-medium",
                  isPositive && "text-success",
                  isNegative && "text-destructive",
                  isNeutral && "text-muted-foreground"
                )}
              >
                {isPositive && <ArrowUp className="h-3 w-3" />}
                {isNegative && <ArrowDown className="h-3 w-3" />}
                {isNeutral && <Minus className="h-3 w-3" />}
                {Math.abs(change)}%
              </span>
              <span className="text-xs text-muted-foreground">
                {changeLabel}
              </span>
            </div>
          )}
        </div>

        {icon && (
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              variant === "default" && "bg-secondary text-muted-foreground",
              variant === "primary" && "bg-primary/10 text-primary",
              variant === "success" && "bg-success/10 text-success",
              variant === "warning" && "bg-warning/10 text-warning",
              variant === "danger" && "bg-destructive/10 text-destructive"
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
