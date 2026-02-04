import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ClientStatus = "active" | "trial" | "churned" | "inactive" | string;

interface ClientStatusBadgeProps {
    status: ClientStatus;
    className?: string;
}

const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
        active: { label: "Ativo", variant: "default", className: "bg-success hover:bg-success/90 text-success-foreground" },
        trial: { label: "Trial", variant: "secondary", className: "bg-warning hover:bg-warning/90 text-warning-foreground" },
        churned: { label: "Cancelado", variant: "destructive", className: "" },
        inactive: { label: "Inativo", variant: "outline", className: "text-muted-foreground" },
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
