import React, { useMemo, useState } from "react";
import { usePageTitle } from "@/contexts/PageTitleContext";
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
import { Client } from "@/hooks/useClients"; // useClients exporta Client interface
import { useUpdateClient, useDeleteClient } from "@/hooks/useUpdateClient";
import { ClientStatusBadge } from "@/components/clients/ClientStatusBadge";
import { CreateClientModal } from "@/components/modals/CreateClientModal";
import { ClientImportModal } from "@/components/modals/ClientImportModal";
import { EditClientModal } from "@/components/modals/EditClientModal";
import { ClientDetailsModal } from "@/components/modals/ClientDetailsModal";
import { useFinancialData } from "@/contexts/FinancialContext";
import { useToast } from "@/hooks/use-toast"; // or components/ui/use-toast
import { startOfMonth, endOfMonth, parseISO, format } from "date-fns";
import { cn } from "@/lib/utils";

// Helper functions (could be moved to utils)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (dateString: string) => {
  return format(parseISO(dateString), 'dd/MM/yyyy');
};

export default function Clients() {
  const { setPageTitle } = usePageTitle();
  const { clients, invoices, selectedMonth, isLoading } = useFinancialData();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const { toast } = useToast();

  React.useEffect(() => {
    setPageTitle("Clientes", "Gestão de clientes e contratos");
  }, [setPageTitle]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const CYCLE_MONTHS: Record<string, number | null> = {
    monthly: null,
    bimonthly: 2,
    quarterly: 3,
    semiannual: 6,
    yearly: 12,
  };

  const filteredClients = useMemo(() => {
    if (!clients) return [];

    const computed = clients.map(client => {
      const startDate = client.start_date ? parseISO(client.start_date) : parseISO(client.created_at);
      const churnDate = client.churn_date ? parseISO(client.churn_date) : null;

      let calculatedStatus = client.status;

      if (startDate > monthEnd) {
        calculatedStatus = 'future';
      } else if (churnDate && churnDate < monthStart) {
        calculatedStatus = 'churned_past';
      } else if (churnDate && churnDate <= monthEnd) {
        calculatedStatus = 'churned';
      } else {
        calculatedStatus = client.status === 'trial' ? 'trial' : 'active';

        // Para planos de ciclo (não-mensal): verificar se o ciclo expirou
        const cycleDuration = CYCLE_MONTHS[client.billing_cycle || 'monthly'];
        if (cycleDuration !== null) {
          const duration = client.contract_duration || cycleDuration;
          const cycleEnd = new Date(startDate);
          cycleEnd.setMonth(cycleEnd.getMonth() + duration);
          if (monthStart > cycleEnd) {
            calculatedStatus = 'expired';
          }
        }
      }

      return { ...client, calculatedStatus };
    });

    return computed.filter((client) => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus = true;

      // Calculate renewal status for filtering
      let isRenewing = false;
      if (client.start_date) {
        const startDate = parseISO(client.start_date);
        const duration = client.contract_duration || 12;
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + duration);

        const today = new Date();
        // Calculate difference in months: (YearDiff * 12) + MonthDiff
        const monthsToRenew = (endDate.getFullYear() - today.getFullYear()) * 12 + (endDate.getMonth() - today.getMonth());

        // Logic: 0 (current month) or 1 (next month)
        isRenewing = monthsToRenew >= 0 && monthsToRenew <= 1;
      }

      if (statusFilter === "all") matchesStatus = true;
      else if (statusFilter === "active") matchesStatus = client.calculatedStatus === "active" || client.calculatedStatus === "trial";
      else if (statusFilter === "churned") matchesStatus = client.calculatedStatus === "churned" || client.calculatedStatus === "churned_past";
      else if (statusFilter === "renewing") matchesStatus = isRenewing;
      else if (statusFilter === "overdue") matchesStatus = client.calculatedStatus === "expired" || client.status === "churned";
      else matchesStatus = client.calculatedStatus === statusFilter;

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
    const header = ["Nome", "Email", "Status (Mês)", "MRR", "Pagamentos", "LTV", "Tempo de Vida", "Fim do Contrato", "Receita Projetada", "Inicio"];

    const rows = filteredClients.map((c) => {
      const clientInvoices = invoices?.filter(inv => inv.client_id === c.id && inv.status === 'paid') || [];
      const paymentCount = clientInvoices.length;
      const ltv = clientInvoices.reduce((sum, inv) => sum + Number(inv.value), 0);

      const startDate = c.start_date ? new Date(c.start_date) : new Date(c.created_at);
      const endDate = c.churn_date ? new Date(c.churn_date) : new Date();
      const yearsDiff = endDate.getFullYear() - startDate.getFullYear();
      const monthsDiff = endDate.getMonth() - startDate.getMonth();
      const totalMonths = (yearsDiff * 12) + monthsDiff;
      const lifetimeStr = totalMonths < 1 ? "Novo" : `${totalMonths} meses`;

      // Projections
      const contractDuration = c.contract_duration || 12;
      const contractEndDate = new Date(startDate);
      contractEndDate.setMonth(contractEndDate.getMonth() + contractDuration);

      const today = new Date();
      const remainingTime = contractEndDate.getTime() - today.getTime();
      const isExpired = remainingTime < 0;
      const remainingMonths = isExpired ? 0 : Math.ceil(remainingTime / (1000 * 60 * 60 * 24 * 30));
      const projectedRevenue = remainingMonths * c.mrr;

      return [
        c.name,
        c.email || '',
        c.calculatedStatus,
        c.mrr,
        paymentCount,
        ltv,
        lifetimeStr,
        contractEndDate.toISOString().split('T')[0],
        projectedRevenue,
        c.start_date || ''
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [header.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clientes_completo.csv");
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
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
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
          <ClientImportModal />
          <CreateClientModal />
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {['Todos', 'Ativos', 'A Renovar', 'Inadimplentes'].map((tab) => {
              const isSelected = (statusFilter === 'all' && tab === 'Todos') ||
                (statusFilter === 'active' && tab === 'Ativos') ||
                (statusFilter === 'renewing' && tab === 'A Renovar') ||
                (statusFilter === 'overdue' && tab === 'Inadimplentes');

              let count = 0;
              if (tab === 'Todos') count = filteredClients.length; // Shows current view count
              if (tab === 'Ativos') {
                count = clients?.filter(c => c.status === 'active' || c.status === 'trial').length || 0;
              }
              if (tab === 'A Renovar') {
                count = clients?.filter(c => {
                  if (!c.start_date) return false;
                  const startDate = parseISO(c.start_date);
                  const duration = c.contract_duration || 12;
                  const endDate = new Date(startDate);
                  endDate.setMonth(endDate.getMonth() + duration);

                  const today = new Date();
                  const months = (endDate.getFullYear() - today.getFullYear()) * 12 + (endDate.getMonth() - today.getMonth());
                  return months >= 0 && months <= 1;
                }).length || 0;
              }
              if (tab === 'Inadimplentes') {
                // Using 'churned' as proxy for now or specific status if added
                count = clients?.filter(c => c.status === 'churned').length || 0;
              }


              return (
                <button
                  key={tab}
                  onClick={() => {
                    if (tab === 'Todos') setStatusFilter('all');
                    if (tab === 'Ativos') setStatusFilter('active');
                    if (tab === 'A Renovar') setStatusFilter('renewing');
                    if (tab === 'Inadimplentes') setStatusFilter('overdue');
                  }}
                  className={cn(
                    isSelected
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground',
                    'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
                  )}
                >
                  {tab}
                  {tab !== 'Todos' && <span className={cn(
                    "ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block",
                    tab === 'Ativos' ? 'bg-green-100 text-green-800' :
                      tab === 'A Renovar' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  )}>{count}</span>}
                </button>
              );
            })}
          </nav>
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
                  <th>Plano & Ciclo</th>
                  <th>Produtos</th>
                  <th>MRR</th>
                  <th>Status</th>
                  <th>Contrato & Renovação</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const subscriptionLabels = client.subscriptions?.map((subscription) => (
                    `${subscription.product?.name || "Produto"} / ${subscription.plan?.name || "Plano"}`
                  )) || [];
                  const productLabels = client.subscriptions?.length
                    ? client.subscriptions.map((subscription) => subscription.product?.name).filter(Boolean)
                    : client.products || [];

                  return (
                    <tr key={client.id}>
                      <td className="font-medium">{client.name}</td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">
                            {subscriptionLabels.length > 0
                              ? subscriptionLabels.join(" + ")
                              : client.plan?.name || "Sem Plano"}
                          </span>
                          {client.billing_cycle && (
                            <span className={cn(
                              "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium w-fit border",
                              client.billing_cycle === 'monthly' && "bg-blue-50 text-blue-700 border-blue-200",
                              client.billing_cycle === 'yearly' && "bg-purple-50 text-purple-700 border-purple-200",
                              client.billing_cycle === 'bimonthly' && "bg-teal-50 text-teal-700 border-teal-200",
                              (client.billing_cycle === 'quarterly' || client.billing_cycle === 'semiannual') && "bg-orange-50 text-orange-700 border-orange-200"
                            )}>
                              {client.billing_cycle === 'monthly' && "Mensal"}
                              {client.billing_cycle === 'bimonthly' && "Bimestral"}
                              {client.billing_cycle === 'quarterly' && "Trimestral"}
                              {client.billing_cycle === 'semiannual' && "Semestral"}
                              {client.billing_cycle === 'yearly' && "Anual"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {productLabels.map((prod) => (
                            <span key={prod} className={cn(
                              "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium border",
                              prod === 'CRM' ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-violet-50 text-violet-700 border-violet-200"
                            )}>
                              {prod}
                            </span>
                          ))}
                          {!productLabels.length && <span className="text-xs text-muted-foreground">-</span>}
                        </div>
                      </td>
                      <td className="font-mono">{formatCurrency(client.mrr)}</td>
                      <td>
                        <ClientStatusBadge status={client.calculatedStatus || client.status} />
                      </td>
                      <td>
                        {(() => {
                          if (!client.start_date && !client.created_at) return <span className="text-muted-foreground">-</span>;

                          const startDate = parseISO(client.start_date || client.created_at);
                          const today = new Date();
                          const isMonthly = client.billing_cycle === 'monthly' || !client.billing_cycle;

                          // Plano mensal recorrente — sem data de fim
                          if (isMonthly && client.status !== 'churned') {
                            return (
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">Início: {format(startDate, 'dd/MM/yyyy')}</span>
                                <span className={cn(
                                  "inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-bold border shadow-sm w-fit",
                                  "bg-blue-50 text-blue-700 border-blue-200"
                                )}>
                                  <span className="text-base">Recorrente</span>
                                </span>
                              </div>
                            );
                          }

                          // Cancelado
                          if (client.status === 'churned' && client.churn_date) {
                            const churnDate = parseISO(client.churn_date);
                            return (
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">Fim: {format(churnDate, 'dd/MM/yyyy')}</span>
                                <span className={cn(
                                  "inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-bold border shadow-sm w-fit",
                                  "bg-red-100 text-red-800 border-red-200"
                                )}>
                                  <span className="text-base">Cancelado</span>
                                </span>
                              </div>
                            );
                          }

                          // Plano de ciclo (trimestral / semestral / anual)
                          const duration = client.contract_duration || CYCLE_MONTHS[client.billing_cycle || 'monthly'] || 12;
                          const endDate = new Date(startDate);
                          endDate.setMonth(endDate.getMonth() + duration);
                          const monthsToRenew = (endDate.getFullYear() - today.getFullYear()) * 12 + (endDate.getMonth() - today.getMonth());

                          let badgeColor = "bg-green-100 text-green-800 border-green-200";
                          let message = "";

                          if (monthsToRenew > 2) {
                            badgeColor = "bg-green-100 text-green-800 border-green-200";
                            message = `${monthsToRenew} meses`;
                          } else if (monthsToRenew >= 1) {
                            badgeColor = "bg-orange-100 text-orange-800 border-orange-200";
                            message = `${monthsToRenew} meses`;
                          } else if (monthsToRenew === 0) {
                            badgeColor = "bg-orange-100 text-orange-800 border-orange-200";
                            message = "Este mês";
                          } else {
                            badgeColor = "bg-red-100 text-red-800 border-red-200";
                            message = `Vencido (${Math.abs(monthsToRenew)} m)`;
                          }

                          return (
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">Fim: {format(endDate, 'dd/MM/yyyy')}</span>
                              <span className={cn(
                                "inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-bold border shadow-sm w-fit",
                                badgeColor
                              )}>
                                <span className="text-base">{message}</span>
                              </span>
                            </div>
                          );
                        })()}
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
                                setDetailClient(client);
                                setDetailOpen(true);
                              }}
                            >
                              <Info className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
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
                  );
                })}
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
      <ClientDetailsModal client={detailClient} invoices={invoices} open={detailOpen} onOpenChange={setDetailOpen} />

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
    </>
  );
}
