import { useMemo, useState } from "react";
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
import { CreateClientModal } from "@/components/modals/CreateClientModal";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

export default function Clients() {
  const { data: clients, isLoading } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter((client) => {
      const matchesSearch = client.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  const { activeClients, trialClients, churnedClients } = useMemo(() => {
    if (!clients)
      return { activeClients: 0, trialClients: 0, churnedClients: 0 };
    return {
      activeClients: clients.filter((c) => c.status === "active").length,
      trialClients: clients.filter((c) => c.status === "trial").length,
      churnedClients: clients.filter((c) => c.status === "churned").length,
    };
  }, [clients]);

  const handleExport = () => {
    if (!clients) return;
    const header = ["Nome", "Email", "Status", "MRR", "Inicio"];
    const rows = clients.map((c) => [
      c.name,
      c.email || '',
      c.status,
      c.mrr,
      c.start_date || '',
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [header.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clientes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <CreateClientModal />
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
          {filteredClients.length > 0 ? (
            <table className="data-table">
              <thead className="bg-muted/50">
                <tr>
                  <th>Cliente</th>
                  <th>Email</th>
                  <th>Plano</th>
                  <th>MRR</th>
                  <th>Status</th>
                  <th>Início</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td className="font-medium">{client.name}</td>
                    <td className="text-muted-foreground">
                      {client.email || "-"}
                    </td>
                    <td>{client.plan?.name || "-"}</td>
                    <td className="font-mono">{formatCurrency(client.mrr)}</td>
                    <td>
                      <ClientStatusBadge status={client.status} />
                    </td>
                    <td className="font-mono text-muted-foreground">
                      {client.start_date
                        ? formatDate(client.start_date)
                        : "-"}
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
                Mude os filtros ou adicione um novo cliente.
              </p>
              <div className="mt-4">
                <CreateClientModal />
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
