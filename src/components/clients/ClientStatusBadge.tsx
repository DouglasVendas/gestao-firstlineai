import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ClientStatus = "active" | "trial" | "churned" | "inactive" | string;

interface ClientStatusBadgeProps {
    status: ClientStatus;
    className?: string;
}

const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
        active: { label: "Adimplente", variant: "default", className: "bg-success hover:bg-success/90 text-success-foreground" },
        trial: { label: "Trial", variant: "secondary", className: "bg-warning hover:bg-warning/90 text-warning-foreground" },
        churned: { label: "Cancelado", variant: "destructive", className: "" },
        churned_past: { label: "Cancelado", variant: "destructive", className: "" },
        inactive: { label: "Inativo", variant: "outline", className: "text-muted-foreground" },
        overdue: { label: "Inadimplente", variant: "destructive", className: "bg-red-500 hover:bg-red-600 text-white" },
        expired: { label: "Ciclo Expirado", variant: "outline", className: "border-amber-500 text-amber-600 bg-amber-50" },
    };
    return config[status] || config.inactive;
};

export function ClientStatusBadge({ status, className }: ClientStatusBadgeProps) {
    const { label, variant, className: statusClass } = getStatusConfig(status);

    return (
        <Badge variant={variant} className={cn("font-medium", statusClass, className)}>
            {label}
        </Badge>
    );
}
