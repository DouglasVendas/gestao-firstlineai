import { useMemo } from "react";
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
import { useClients } from "@/hooks/useClients";
import { ClientStatusBadge } from "@/components/clients/ClientStatusBadge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

const getHealthScoreColor = (score: number) => {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
};

export default function Clients() {
  const { data: clients, isLoading } = useClients();

  const { activeClients, trialClients, churnedClients } = useMemo(() => {
    if (!clients) return { activeClients: 0, trialClients: 0, churnedClients: 0 };
    return {
      activeClients: clients.filter((c) => c.status === "active").length,
      trialClients: clients.filter((c) => c.status === "trial").length,
      churnedClients: clients.filter((c) => c.status === "churned").length,
    };
  }, [clients]);

  if (isLoading) {
    return (
      <AppLayout title="Clientes" subtitle="Gestão de clientes e contratos">
        <div className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-10 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Clientes" subtitle="Gestão de clientes e contratos">
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
            {clients?.length || 0}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Clientes Ativos</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-success">
            {activeClients}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Em Trial</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-warning">
            {trialClients}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Churned (Total)</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-destructive">
            {churnedClients}
          </p>
        </div>
      </div>

      {/* Clients Table */}
      <div className="metric-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          {clients && clients.length > 0 ? (
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
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="font-medium">{client.name}</td>
                    <td className="font-mono text-muted-foreground">
                      {client.cnpj || "-"}
                    </td>
                    <td>{client.plan?.name || "-"}</td>
                    <td className="font-mono">{formatCurrency(client.mrr)}</td>
                    <td className="font-mono">{formatCurrency(client.arr)}</td>
                    <td>
                      <ClientStatusBadge status={client.status} />
                    </td>
                    <td className="font-mono text-muted-foreground">
                      {client.start_date ? formatDate(client.start_date) : "-"}
                    </td>
                    <td className="font-mono text-muted-foreground">
                      {client.renewal_date ? formatDate(client.renewal_date) : "-"}
                    </td>
                    <td>
                      <span
                        className={`font-mono font-medium ${getHealthScoreColor(
                          client.health_score
                        )}`}
                      >
                        {client.health_score}%
                      </span>
                    </td>
                    <td className="text-muted-foreground">
                      {client.payment_method || "-"}
                    </td>
                    <td>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                Nenhum cliente encontrado
              </p>
              <p className="text-sm text-muted-foreground">
                Adicione um novo cliente para começar.
              </p>
              <Button className="mt-4" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
