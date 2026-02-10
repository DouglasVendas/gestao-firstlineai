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
import { Search, Filter, Download, MoreHorizontal, Edit, UserX, Trash2 } from "lucide-react";
import { useClients, type Client } from "@/hooks/useClients";
import { useInvoices } from "@/hooks/useInvoices";
import { useUpdateClient, useDeleteClient } from "@/hooks/useUpdateClient";
import { ClientStatusBadge } from "@/components/clients/ClientStatusBadge";
import { CreateClientModal } from "@/components/modals/CreateClientModal";
import { EditClientModal } from "@/components/modals/EditClientModal";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Clients() {
  const { data: clients, isLoading } = useClients();
  const { data: invoices } = useInvoices();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const filteredClients = useMemo(() => {
    if (!clients) return [];

    const computed = clients.map(client => {
      let derived = client.status;
      // If client is active, check for overdue invoices
      if (derived === 'active' && invoices) {
        const hasOverdue = invoices.some(inv =>
          inv.client_id === client.id &&
          (inv.status === 'overdue' || (inv.status === 'pending' && new Date(inv.due_date) < new Date()))
        );
        if (hasOverdue) derived = 'overdue';
      }
      return { ...client, status: derived };
    });

    return computed.filter((client) => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, invoices, searchTerm, statusFilter]);

  const { activeClients, trialClients, churnedClients } = useMemo(() => {
    if (!clients) return { activeClients: 0, trialClients: 0, churnedClients: 0 };
    return {
      activeClients: clients.filter((c) => c.status === "active").length,
      trialClients: clients.filter((c) => c.status === "trial").length,
      churnedClients: clients.filter((c) => c.status === "churned").length,
    };
  }, [clients]);

  const handleExport = () => {
    if (!clients) return;
    const header = ["Nome", "Email", "Status", "MRR", "Inicio"];
    const rows = clients.map((c) => [c.name, c.email || '', c.status, c.mrr, c.start_date || '']);
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
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground">{clients?.length || 0}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Clientes Ativos</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-success">{activeClients}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Em Trial</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-warning">{trialClients}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Churned (Total)</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-destructive">{churnedClients}</p>
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
                  <th>Status</th>
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
                      <ClientStatusBadge status={client.status} />
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
