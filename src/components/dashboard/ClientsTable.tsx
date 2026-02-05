import { MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRecentClients } from "@/hooks/useClients";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (date: string | null) => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
};

const getStatusBadge = (status: string) => {
  const config: Record<string, { label: string; class: string }> = {
    active: { label: "Ativo", class: "status-badge-active" },
    trial: { label: "Trial", class: "status-badge-trial" },
    churned: { label: "Cancelado", class: "status-badge-churned" },
    inactive: { label: "Inativo", class: "status-badge-inactive" },
  };
  return config[status] || config["inactive"];
};


export function ClientsTable() {
  const { data: recentClients, isLoading } = useRecentClients();

  if (isLoading) {
    return (
      <div className="metric-card flex h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="metric-card animate-slide-up overflow-hidden p-0">
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Clientes Recentes
            </h3>
            <p className="text-sm text-muted-foreground">
              Últimos clientes cadastrados
            </p>
          </div>
          <Button variant="outline" size="sm">
            Ver todos
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead className="bg-muted/50">
            <tr>
              <th>Cliente</th>
              <th>Plano</th>
              <th>MRR</th>
              <th>Status</th>
              <th>Início</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recentClients.map((client) => {
              const statusBadge = getStatusBadge(client.status);
              return (
                <tr key={client.id}>
                  <td className="font-medium">{client.name}</td>
                  <td>{client.plan?.name || "-"}</td>
                  <td className="font-mono">{formatCurrency(client.mrr)}</td>
                  <td>
                    <span className={statusBadge.class}>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          client.status === "active" && "bg-success",
                          client.status === "trial" && "bg-warning",
                          client.status === "churned" && "bg-destructive",
                          client.status === "inactive" && "bg-muted-foreground"
                        )}
                      />
                      {statusBadge.label}
                    </span>
                  </td>
                  <td className="font-mono text-muted-foreground">
                    {formatDate(client.start_date)}
                  </td>
                  <td>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
