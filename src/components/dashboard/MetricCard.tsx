import { ArrowDown, ArrowUp, Minus, Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number | { value: number; isPositive: boolean };
  changeLabel?: string;
  description?: string;
  icon?: React.ReactNode | LucideIcon;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  allowPrivacy?: boolean;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel = "vs. mês anterior",
  description,
  icon,
  variant = "default",
  allowPrivacy = false,
}: MetricCardProps) {
  const [isHidden, setIsHidden] = useState(false);

  // Handle both number and object formats for change
  const changeValue = typeof change === "object" ? change.value : change;
  const isPositive = typeof change === "object" ? change.isPositive : (change !== undefined && change > 0);
  const isNegative = typeof change === "object" ? !change.isPositive : (change !== undefined && change < 0);
  const isNeutral = changeValue === 0;

  // Handle both ReactNode and LucideIcon for icon
  const renderIcon = () => {
    if (!icon) return null;
    // Check if it's a valid React component (function or forwardRef object)
    if (typeof icon === "function" || (typeof icon === "object" && icon !== null && "$$typeof" in icon && "render" in icon)) {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="h-6 w-6" />;
    }
    return icon as React.ReactNode;
  };
  const iconNode = renderIcon();

  return (
    <div className="metric-card glow-border animate-fade-in relative group">
      <div className="flex items-start justify-between">
        <div className="space-y-2 w-full">
          <div className="flex items-center gap-2">
            <p className="metric-label">{title}</p>
            {allowPrivacy && (
              <button
                onClick={() => setIsHidden(!isHidden)}
                className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                title={isHidden ? "Mostrar valor" : "Ocultar valor"}
              >
                {isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            )}
          </div>

          <p className={cn("metric-value font-mono transition-all duration-300", isHidden && "blur-md select-none")}>
            {value}
          </p>

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
                {Math.round(Math.abs(changeValue))}%
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
              "flex h-12 w-12 items-center justify-center rounded-xl ml-4",
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