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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Filter, Download, MoreHorizontal, Edit, UserX, Trash2, Loader2, Info } from "lucide-react";
import { Client } from "@/hooks/useClients";
import { useUpdateClient, useDeleteClient } from "@/hooks/useUpdateClient";
import { ClientStatusBadge } from "@/components/clients/ClientStatusBadge";
import { CreateClientModal } from "@/components/modals/CreateClientModal";
import { EditClientModal } from "@/components/modals/EditClientModal";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { useFinancialData } from "@/contexts/FinancialContext";
import { startOfMonth, endOfMonth, parseISO, isWithinInterval, isSameMonth } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Clients() {
  const { clients, invoices, selectedMonth, isLoading } = useFinancialData();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const filteredClients = useMemo(() => {
    if (!clients) return [];

    const computed = clients.map(client => {
      // Logic matching useFinancialMetrics
      const startDate = client.start_date ? parseISO(client.start_date) : parseISO(client.created_at);
      const churnDate = client.churn_date ? parseISO(client.churn_date) : null;

      let calculatedStatus = client.status;

      // Determine status based on selectedMonth
      if (startDate > monthEnd) {
        calculatedStatus = 'future'; // Not started yet in this context
      } else if (churnDate && churnDate < monthStart) {
        calculatedStatus = 'churned_past'; // Previously churned
      } else if (churnDate && churnDate <= monthEnd) {
        calculatedStatus = 'churned'; // Churned in this month (or on first day)
      } else {
        // Active in this month context.
        // Now check for 'overdue' if active
        // TODO: Check overdue invoices relative to selectedMonth? 
        // Or just current overdue status? Usually overdue is a current state.
        // If we are looking at specific month, seeing "Overdue" might be confusing if they paid later.
        // For historical accuracy, we should check if they had overdue invoices AT THAT TIME. 
        // But that's complex. Let's stick to "Active" for historical view, or specific status if known.
        // For now, let's keep 'active' if they basically existed and didn't churn.
        calculatedStatus = 'active';

        // Check 'trial'
        if (client.status === 'trial') {
          // If trial end date < monthStart, maybe they converted?
          // This depends on how trial status is stored (if historical).
          // Assuming 'trial' status in DB is current.
          // For historical, if they changed to active, we might not know when.
          // Let's rely on DB status if it matches the timeframe, otherwise 'active'.
          if (client.status === 'trial') calculatedStatus = 'trial';
        }
      }

      return { ...client, calculatedStatus };
    });

    return computed.filter((client) => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === "all") matchesStatus = true;
      else if (statusFilter === "active") matchesStatus = client.calculatedStatus === "active" || client.calculatedStatus === "trial";
      else if (statusFilter === "churned") matchesStatus = client.calculatedStatus === "churned" || client.calculatedStatus === "churned_past";
      else matchesStatus = client.calculatedStatus === statusFilter;

      // Optional: hide 'future' clients or 'churned_past' if generic view?
      // If "All", show everything? Maybe hide future.
      if (client.calculatedStatus === 'future') matchesStatus = false;

      return matchesSearch && matchesStatus;
    });
  }, [clients, invoices, searchTerm, statusFilter, selectedMonth]);

  const stats = useMemo(() => {
    const active = filteredClients.filter(c => c.calculatedStatus === 'active').length;
    const trial = filteredClients.filter(c => c.calculatedStatus === 'trial').length;
    const churned = filteredClients.filter(c => c.calculatedStatus === 'churned').length;
    // Note: churned here is "Churned IN this month" if we filter properly, or total churned depending on list content.
    // Dashboard shows "Active Clients" (Count).
    return { active, trial, churned };
  }, [filteredClients]);

  const handleExport = () => {
    if (!filteredClients) return;
    const header = ["Nome", "Email", "Status (Mês)", "MRR", "Inicio"];
    const rows = filteredClients.map((c) => [c.name, c.email || '', c.calculatedStatus, c.mrr, c.start_date || '']);
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

  const handleChurn = (client: Client) => {
    updateClient.mutate(
      { id: client.id, status: "churned", churn_date: new Date().toISOString().split("T")[0] },
      {
        onSuccess: () => toast({ title: "Assinatura cancelada", description: `${client.name} marcado como churned.` }),
        onError: (err) => toast({ variant: "destructive", title: "Erro", description: err.message }),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteClient.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: "Cliente excluído", description: `${deleteTarget.name} foi removido.` });
        setDeleteTarget(null);
      },
      onError: (err) => toast({ variant: "destructive", title: "Erro", description: err.message }),
    });
  };

  if (isLoading) {
    return (
      <AppLayout title="Clientes" subtitle="Gestão de clientes e contratos">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground">{filteredClients.length}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Clientes Ativos</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-success">{stats.active}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Em Trial</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-warning">{stats.trial}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Churned (Total)</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-destructive">{stats.churned}</p>
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
                  <th>Plano</th>
                  <th>MRR</th>
                  <th>Status (Calculado)</th>
                  <th>Início</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td className="font-medium">{client.name}</td>
                    <td>{client.plan?.name || "-"}</td>
                    <td className="font-mono">{formatCurrency(client.mrr)}</td>
                    <td>
                      <ClientStatusBadge status={client.calculatedStatus || client.status} />
                    </td>
                    <td className="font-mono text-muted-foreground">
                      {client.start_date ? formatDate(client.start_date) : "-"}
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditClient(client);
                              setEditOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleChurn(client)}
                            disabled={client.status === "churned"}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Cancelar assinatura
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(client)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">Nenhum cliente encontrado</p>
              <p className="text-sm text-muted-foreground">Mude os filtros ou adicione um novo cliente.</p>
              <div className="mt-4">
                <CreateClientModal />
              </div>
            </div>
          )}
        </div>
      </div>

      <EditClientModal client={editClient} open={editOpen} onOpenChange={setEditOpen} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {deleteTarget?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
