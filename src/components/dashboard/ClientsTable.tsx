import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  plan: string;
  mrr: number;
  status: "active" | "trial" | "churned" | "inactive";
  lastPayment: string;
  healthScore: number;
}

const clients: Client[] = [
  {
    id: "1",
    name: "TechCorp Brasil",
    plan: "Enterprise",
    mrr: 12500,
    status: "active",
    lastPayment: "2024-01-15",
    healthScore: 92,
  },
  {
    id: "2",
    name: "Startup Inovação",
    plan: "Pro",
    mrr: 2990,
    status: "active",
    lastPayment: "2024-01-12",
    healthScore: 78,
  },
  {
    id: "3",
    name: "Consultoria ABC",
    plan: "Pro",
    mrr: 2990,
    status: "trial",
    lastPayment: "-",
    healthScore: 65,
  },
  {
    id: "4",
    name: "E-commerce Plus",
    plan: "Enterprise",
    mrr: 8900,
    status: "active",
    lastPayment: "2024-01-10",
    healthScore: 88,
  },
  {
    id: "5",
    name: "Agência Digital",
    plan: "Basic",
    mrr: 990,
    status: "churned",
    lastPayment: "2023-12-05",
    healthScore: 15,
  },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (date: string) => {
  if (date === "-") return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
};

const getStatusBadge = (status: Client["status"]) => {
  const config = {
    active: { label: "Ativo", class: "status-badge-active" },
    trial: { label: "Trial", class: "status-badge-trial" },
    churned: { label: "Cancelado", class: "status-badge-churned" },
    inactive: { label: "Inativo", class: "status-badge-inactive" },
  };
  return config[status];
};

const getHealthScoreColor = (score: number) => {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
};

export function ClientsTable() {
  return (
    <div className="metric-card animate-slide-up overflow-hidden p-0">
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Clientes Recentes
            </h3>
            <p className="text-sm text-muted-foreground">
              Últimos 5 clientes ativos
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
              <th>Último Pagamento</th>
              <th>Health Score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const statusBadge = getStatusBadge(client.status);
              return (
                <tr key={client.id}>
                  <td className="font-medium">{client.name}</td>
                  <td>{client.plan}</td>
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
                    {formatDate(client.lastPayment)}
                  </td>
                  <td>
                    <span
                      className={cn(
                        "font-mono font-medium",
                        getHealthScoreColor(client.healthScore)
                      )}
                    >
                      {client.healthScore}%
                    </span>
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
