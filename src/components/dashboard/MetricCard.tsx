import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number | { value: number; isPositive: boolean };
  changeLabel?: string;
  description?: string;
  icon?: React.ReactNode | LucideIcon;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel = "vs. mês anterior",
  description,
  icon,
  variant = "default",
}: MetricCardProps) {
  // Handle both number and object formats for change
  const changeValue = typeof change === "object" ? change.value : change;
  const isPositive = typeof change === "object" ? change.isPositive : (change !== undefined && change > 0);
  const isNegative = typeof change === "object" ? !change.isPositive : (change !== undefined && change < 0);
  const isNeutral = changeValue === 0;

  // Handle both ReactNode and LucideIcon for icon
  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === "function") {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="h-6 w-6" />;
    }
    return icon as React.ReactNode;
  };
  const iconNode = renderIcon();

  return (
    <div className="metric-card glow-border animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="metric-label">{title}</p>
          <p className="metric-value font-mono">{value}</p>
          
          {changeValue !== undefined && (
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
                {Math.abs(changeValue)}%
              </span>
              <span className="text-xs text-muted-foreground">
                {description || changeLabel}
              </span>
            </div>
          )}
          
          {description && changeValue === undefined && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {iconNode && (
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
            {iconNode}
          </div>
        )}
      </div>
    </div>
  );
}