import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter, Download, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  cnpj: string;
  plan: string;
  mrr: number;
  arr: number;
  status: "active" | "trial" | "churned" | "inactive";
  startDate: string;
  renewalDate: string;
  healthScore: number;
  paymentMethod: string;
}

const clients: Client[] = [
  {
    id: "1",
    name: "TechCorp Brasil",
    cnpj: "12.345.678/0001-90",
    plan: "Enterprise",
    mrr: 12500,
    arr: 150000,
    status: "active",
    startDate: "2023-03-15",
    renewalDate: "2024-03-15",
    healthScore: 92,
    paymentMethod: "Cartão",
  },
  {
    id: "2",
    name: "Startup Inovação",
    cnpj: "98.765.432/0001-10",
    plan: "Pro",
    mrr: 2990,
    arr: 35880,
    status: "active",
    startDate: "2023-06-01",
    renewalDate: "2024-06-01",
    healthScore: 78,
    paymentMethod: "Boleto",
  },
  {
    id: "3",
    name: "Consultoria ABC",
    cnpj: "11.222.333/0001-44",
    plan: "Pro",
    mrr: 2990,
    arr: 35880,
    status: "trial",
    startDate: "2024-01-05",
    renewalDate: "-",
    healthScore: 65,
    paymentMethod: "-",
  },
  {
    id: "4",
    name: "E-commerce Plus",
    cnpj: "55.666.777/0001-88",
    plan: "Enterprise",
    mrr: 8900,
    arr: 106800,
    status: "active",
    startDate: "2023-01-10",
    renewalDate: "2024-01-10",
    healthScore: 88,
    paymentMethod: "PIX",
  },
  {
    id: "5",
    name: "Agência Digital",
    cnpj: "33.444.555/0001-66",
    plan: "Basic",
    mrr: 0,
    arr: 0,
    status: "churned",
    startDate: "2023-08-20",
    renewalDate: "-",
    healthScore: 15,
    paymentMethod: "Boleto",
  },
  {
    id: "6",
    name: "Fintech Solutions",
    cnpj: "77.888.999/0001-22",
    plan: "Enterprise",
    mrr: 15000,
    arr: 180000,
    status: "active",
    startDate: "2022-11-01",
    renewalDate: "2024-11-01",
    healthScore: 95,
    paymentMethod: "Cartão",
  },
  {
    id: "7",
    name: "LogTech Brasil",
    cnpj: "44.555.666/0001-77",
    plan: "Pro",
    mrr: 4990,
    arr: 59880,
    status: "active",
    startDate: "2023-09-15",
    renewalDate: "2024-09-15",
    healthScore: 82,
    paymentMethod: "PIX",
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

export default function Clients() {
  return (
    <AppLayout
      title="Clientes"
      subtitle="Gestão de clientes e contratos"
    >
      {/* Actions Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              className="bg-secondary pl-10"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-40 bg-secondary">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="churned">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Total de Clientes</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
            186
          </p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Clientes Ativos</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-success">
            172
          </p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Em Trial</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-warning">
            8
          </p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Churned (30d)</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-destructive">
            6
          </p>
        </div>
      </div>

      {/* Clients Table */}
      <div className="metric-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-muted/50">
              <tr>
                <th>Cliente</th>
                <th>CNPJ</th>
                <th>Plano</th>
                <th>MRR</th>
                <th>ARR</th>
                <th>Status</th>
                <th>Início</th>
                <th>Renovação</th>
                <th>Health</th>
                <th>Pagamento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const statusBadge = getStatusBadge(client.status);
                return (
                  <tr key={client.id}>
                    <td className="font-medium">{client.name}</td>
                    <td className="font-mono text-muted-foreground">
                      {client.cnpj}
                    </td>
                    <td>{client.plan}</td>
                    <td className="font-mono">{formatCurrency(client.mrr)}</td>
                    <td className="font-mono">{formatCurrency(client.arr)}</td>
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
                      {formatDate(client.startDate)}
                    </td>
                    <td className="font-mono text-muted-foreground">
                      {formatDate(client.renewalDate)}
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
                    <td className="text-muted-foreground">
                      {client.paymentMethod}
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
    </AppLayout>
  );
}
