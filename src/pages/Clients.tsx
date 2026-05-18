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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import {
  Search,
  Download,
  MoreHorizontal,
  Edit,
  UserX,
  Trash2,
  Loader2,
  Info,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { Client, getEffectiveMRR } from "@/hooks/useClients";
import { Invoice } from "@/hooks/useInvoices";
import { useUpdateClient, useDeleteClient } from "@/hooks/useUpdateClient";
import { ClientStatusBadge } from "@/components/clients/ClientStatusBadge";
import { CreateClientModal } from "@/components/modals/CreateClientModal";
import { ClientImportModal } from "@/components/modals/ClientImportModal";
import { EditClientModal } from "@/components/modals/EditClientModal";
import { ClientDetailsModal } from "@/components/modals/ClientDetailsModal";
import { useFinancialData } from "@/contexts/FinancialContext";
import { useToast } from "@/hooks/use-toast";
import { startOfMonth, endOfMonth, parseISO, format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatClientName } from "@/lib/clientNames";
import { calculateClientProjectedRevenue } from "@/lib/clientRevenue";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
};

const CYCLE_MONTHS: Record<string, number | null> = {
  monthly: null,
  bimonthly: 2,
  quarterly: 3,
  semiannual: 6,
  yearly: 12,
};

type EnrichedClient = Client & {
  calculatedStatus: string;
  ltvReceived: number;
  openAmount: number;
  overdueAmount: number;
  invoiceCount: number;
  overdueCount: number;
  pendingCount: number;
  projectedRevenue: number;
  contractEndDate: Date | null;
  renewInDays: number | null;
  normalizedMrr: number;
  healthLabel: "saudavel" | "atencao" | "critico";
  inadimplente: boolean;
};

function escapeCsvCell(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

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
  const [planFilter, setPlanFilter] = useState("all");
  const [billingCycleFilter, setBillingCycleFilter] = useState("all");
  const [renewalFilter, setRenewalFilter] = useState("all");
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [mrrMin, setMrrMin] = useState("");
  const [mrrMax, setMrrMax] = useState("");
  const [ltvMin, setLtvMin] = useState("");
  const [ltvMax, setLtvMax] = useState("");
  const [projectedMin, setProjectedMin] = useState("");
  const [projectedMax, setProjectedMax] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "mrr" | "ltv" | "overdue" | "renewal" | "projected">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [columns, setColumns] = useState({
    plan: true,
    products: true,
    mrr: true,
    status: true,
    health: true,
    ltv: true,
    projected: true,
    contract: true,
  });

  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const enrichedClients = useMemo<EnrichedClient[]>(() => {
    if (!clients) return [];

    return clients.map((client) => {
      const startDate = client.start_date ? parseISO(client.start_date) : parseISO(client.created_at);
      const churnDate = client.churn_date ? parseISO(client.churn_date) : null;

      let calculatedStatus = client.status;

      if (startDate > monthEnd) {
        calculatedStatus = "future";
      } else if (churnDate && churnDate < monthStart) {
        calculatedStatus = "churned_past";
      } else if (churnDate && churnDate <= monthEnd) {
        calculatedStatus = "churned";
      } else {
        calculatedStatus = client.status === "trial" ? "trial" : "active";

        const cycleDuration = CYCLE_MONTHS[client.billing_cycle || "monthly"];
        if (cycleDuration !== null) {
          const duration = client.contract_duration || cycleDuration;
          const cycleEnd = new Date(startDate);
          cycleEnd.setMonth(cycleEnd.getMonth() + duration);
          if (monthStart > cycleEnd) {
            calculatedStatus = "expired";
          }
        }
      }

      const clientInvoices = (invoices || []).filter((inv) => inv.client_id === client.id);
      const paidInvoices = clientInvoices.filter((inv) => inv.status === "paid");
      const overdueInvoices = clientInvoices.filter((inv) => inv.status === "overdue");
      const pendingInvoices = clientInvoices.filter((inv) => inv.status === "pending");

      const ltvReceived = paidInvoices.reduce((sum, inv) => sum + Number(inv.value || 0), 0);
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.value || 0), 0);
      const openAmount = [...overdueInvoices, ...pendingInvoices].reduce((sum, inv) => sum + Number(inv.value || 0), 0);

      const contractDuration = client.contract_duration || 12;
      const contractEndDate = new Date(startDate);
      contractEndDate.setMonth(contractEndDate.getMonth() + contractDuration);
      const renewInDays = Math.ceil((contractEndDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

      const normalizedMrr = getEffectiveMRR(client);
      const projectedRevenue = calculateClientProjectedRevenue(client);

      const inadimplente = overdueInvoices.length > 0;
      const healthLabel: EnrichedClient["healthLabel"] =
        inadimplente || calculatedStatus === "expired"
          ? "critico"
          : openAmount > 0 || renewInDays <= 30
            ? "atencao"
            : "saudavel";

      return {
        ...client,
        calculatedStatus,
        ltvReceived,
        openAmount,
        overdueAmount,
        invoiceCount: clientInvoices.length,
        overdueCount: overdueInvoices.length,
        pendingCount: pendingInvoices.length,
        projectedRevenue,
        contractEndDate,
        renewInDays,
        normalizedMrr,
        healthLabel,
        inadimplente,
      };
    });
  }, [clients, invoices, monthEnd, monthStart]);

  const filteredClients = useMemo(() => {
    return enrichedClients.filter((client) => {
      const displayName = formatClientName(client.name);
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        client.name.toLowerCase().includes(search) ||
        displayName.toLowerCase().includes(search) ||
        (client.email || "").toLowerCase().includes(search);

      let matchesStatus = true;
      if (statusFilter === "all") matchesStatus = true;
      else if (statusFilter === "active") matchesStatus = client.calculatedStatus === "active";
      else if (statusFilter === "trial") matchesStatus = client.calculatedStatus === "trial";
      else if (statusFilter === "churned") matchesStatus = ["churned", "churned_past"].includes(client.calculatedStatus);
      else if (statusFilter === "expired") matchesStatus = client.calculatedStatus === "expired";

      if (client.calculatedStatus === "future") matchesStatus = false;

      const planName = (client.plan?.name || "").toLowerCase();
      const products = (client.products || []).join(" ").toLowerCase();
      let matchesPlan = true;
      if (planFilter === "no_plan") matchesPlan = !client.plan?.name;
      else if (planFilter === "trial") matchesPlan = client.calculatedStatus === "trial" || planName.includes("trial");
      else if (planFilter === "with_product") matchesPlan = (client.products || []).length > 0;
      else if (planFilter === "enterprise") matchesPlan = planName.includes("enterprise") || products.includes("enterprise");
      else if (planFilter !== "all") matchesPlan = planName === planFilter;

      const matchesCycle = billingCycleFilter === "all" || (client.billing_cycle || "monthly") === billingCycleFilter;

      let matchesRenewal = true;
      if (renewalFilter === "30d") matchesRenewal = client.renewInDays !== null && client.renewInDays >= 0 && client.renewInDays <= 30;
      if (renewalFilter === "60d") matchesRenewal = client.renewInDays !== null && client.renewInDays >= 0 && client.renewInDays <= 60;
      if (renewalFilter === "90d") matchesRenewal = client.renewInDays !== null && client.renewInDays >= 0 && client.renewInDays <= 90;

      let matchesInvoice = true;
      if (invoiceFilter === "overdue") matchesInvoice = client.overdueCount > 0;
      if (invoiceFilter === "open") matchesInvoice = client.pendingCount > 0;
      if (invoiceFilter === "no_invoices") matchesInvoice = client.invoiceCount === 0;

      const parsedMrrMin = mrrMin ? Number(mrrMin) : null;
      const parsedMrrMax = mrrMax ? Number(mrrMax) : null;
      const parsedLtvMin = ltvMin ? Number(ltvMin) : null;
      const parsedLtvMax = ltvMax ? Number(ltvMax) : null;
      const parsedProjectedMin = projectedMin ? Number(projectedMin) : null;
      const parsedProjectedMax = projectedMax ? Number(projectedMax) : null;

      const matchesMrr =
        (parsedMrrMin === null || client.normalizedMrr >= parsedMrrMin) &&
        (parsedMrrMax === null || client.normalizedMrr <= parsedMrrMax);
      const matchesLtv =
        (parsedLtvMin === null || client.ltvReceived >= parsedLtvMin) &&
        (parsedLtvMax === null || client.ltvReceived <= parsedLtvMax);
      const matchesProjected =
        (parsedProjectedMin === null || client.projectedRevenue >= parsedProjectedMin) &&
        (parsedProjectedMax === null || client.projectedRevenue <= parsedProjectedMax);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPlan &&
        matchesCycle &&
        matchesRenewal &&
        matchesInvoice &&
        matchesMrr &&
        matchesLtv &&
        matchesProjected
      );
    });
  }, [
    enrichedClients,
    searchTerm,
    statusFilter,
    planFilter,
    billingCycleFilter,
    renewalFilter,
    invoiceFilter,
    mrrMin,
    mrrMax,
    ltvMin,
    ltvMax,
    projectedMin,
    projectedMax,
  ]);

  const sortedClients = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...filteredClients].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "pt-BR") * direction;
      if (sortBy === "mrr") return (a.normalizedMrr - b.normalizedMrr) * direction;
      if (sortBy === "ltv") return (a.ltvReceived - b.ltvReceived) * direction;
      if (sortBy === "overdue") return (a.overdueAmount - b.overdueAmount) * direction;
      if (sortBy === "projected") return (a.projectedRevenue - b.projectedRevenue) * direction;
      const daysA = a.renewInDays ?? 9999;
      const daysB = b.renewInDays ?? 9999;
      return (daysA - daysB) * direction;
    });
  }, [filteredClients, sortBy, sortDirection]);

  const stats = useMemo(() => {
    const active = sortedClients.filter((c) => c.calculatedStatus === "active").length;
    const trial = sortedClients.filter((c) => c.calculatedStatus === "trial").length;
    const churned = sortedClients.filter((c) => c.calculatedStatus === "churned").length;
    const projectedRevenue = sortedClients.reduce((sum, c) => sum + c.projectedRevenue, 0);
    const overdueClients = sortedClients.filter((c) => c.inadimplente).length;
    return { active, trial, churned, projectedRevenue, overdueClients };
  }, [sortedClients]);

  const hasActiveFilters = useMemo(() => {
    return [
      searchTerm,
      statusFilter !== "all",
      planFilter !== "all",
      billingCycleFilter !== "all",
      renewalFilter !== "all",
      invoiceFilter !== "all",
      mrrMin,
      mrrMax,
      ltvMin,
      ltvMax,
      projectedMin,
      projectedMax,
    ].some(Boolean);
  }, [searchTerm, statusFilter, planFilter, billingCycleFilter, renewalFilter, invoiceFilter, mrrMin, mrrMax, ltvMin, ltvMax, projectedMin, projectedMax]);

  const handleExport = () => {
    if (!sortedClients.length) return;

    const header = [
      "Nome",
      "Email",
      "Status",
      "MRR normalizado",
      "Valor contratado",
      "LTV recebido",
      "Em aberto",
      "Atrasado",
      "Inadimplente",
      "Receita projetada",
      "Renovação",
      "Plano",
      "Ciclo",
    ];

    const rows = sortedClients.map((c) => [
      formatClientName(c.name),
      c.email || "",
      c.calculatedStatus,
      c.normalizedMrr,
      c.mrr,
      c.ltvReceived,
      c.openAmount,
      c.overdueAmount,
      c.inadimplente ? "sim" : "não",
      c.projectedRevenue,
      c.contractEndDate ? format(c.contractEndDate, "yyyy-MM-dd") : "",
      c.plan?.name || "",
      c.billing_cycle || "monthly",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "clientes_filtrados.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleChurn = (client: Client) => {
    updateClient.mutate(
      { id: client.id, status: "churned", churn_date: new Date().toISOString().split("T")[0] },
      {
        onSuccess: () => toast({ title: "Assinatura cancelada", description: `${formatClientName(client.name)} marcado como churned.` }),
        onError: (err) => toast({ variant: "destructive", title: "Erro", description: err.message }),
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteClient.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: "Cliente excluído", description: `${formatClientName(deleteTarget.name)} foi removido.` });
        setDeleteTarget(null);
      },
      onError: (err) => toast({ variant: "destructive", title: "Erro", description: err.message }),
    });
  };

  function resetFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setPlanFilter("all");
    setBillingCycleFilter("all");
    setRenewalFilter("all");
    setInvoiceFilter("all");
    setMrrMin("");
    setMrrMax("");
    setLtvMin("");
    setLtvMax("");
    setProjectedMin("");
    setProjectedMax("");
  }

  function toggleSort(next: typeof sortBy) {
    if (sortBy === next) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(next);
    setSortDirection("desc");
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente, e-mail ou plano..."
                className="bg-secondary pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full bg-secondary sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status: todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
                <SelectItem value="expired">Vencido</SelectItem>
              </SelectContent>
            </Select>

            <Select value={billingCycleFilter} onValueChange={setBillingCycleFilter}>
              <SelectTrigger className="w-full bg-secondary sm:w-44">
                <SelectValue placeholder="Ciclo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Ciclo: todos</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="bimonthly">Bimestral</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="semiannual">Semestral</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <ClientImportModal />
            <CreateClientModal />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="bg-secondary">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Plano: todos</SelectItem>
              <SelectItem value="no_plan">Sem plano</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="with_product">Com produto</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>

          <Select value={renewalFilter} onValueChange={setRenewalFilter}>
            <SelectTrigger className="bg-secondary">
              <SelectValue placeholder="Renovação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Renovação: todas</SelectItem>
              <SelectItem value="30d">Em 30 dias</SelectItem>
              <SelectItem value="60d">Em 60 dias</SelectItem>
              <SelectItem value="90d">Em 90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
            <SelectTrigger className="bg-secondary">
              <SelectValue placeholder="Faturas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Faturas: todas</SelectItem>
              <SelectItem value="overdue">Com fatura atrasada</SelectItem>
              <SelectItem value="open">Com fatura aberta</SelectItem>
              <SelectItem value="no_invoices">Sem faturas</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Colunas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={columns.plan} onCheckedChange={(v) => setColumns((prev) => ({ ...prev, plan: !!v }))}>Plano & Ciclo</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={columns.products} onCheckedChange={(v) => setColumns((prev) => ({ ...prev, products: !!v }))}>Produtos</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={columns.mrr} onCheckedChange={(v) => setColumns((prev) => ({ ...prev, mrr: !!v }))}>MRR</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={columns.status} onCheckedChange={(v) => setColumns((prev) => ({ ...prev, status: !!v }))}>Status</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={columns.health} onCheckedChange={(v) => setColumns((prev) => ({ ...prev, health: !!v }))}>Saúde</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={columns.ltv} onCheckedChange={(v) => setColumns((prev) => ({ ...prev, ltv: !!v }))}>LTV/Em aberto</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={columns.projected} onCheckedChange={(v) => setColumns((prev) => ({ ...prev, projected: !!v }))}>Receita projetada</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={columns.contract} onCheckedChange={(v) => setColumns((prev) => ({ ...prev, contract: !!v }))}>Contrato & Renovação</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={resetFilters}>Limpar</Button>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Input type="number" placeholder="MRR mínimo" value={mrrMin} onChange={(e) => setMrrMin(e.target.value)} />
          <Input type="number" placeholder="MRR máximo" value={mrrMax} onChange={(e) => setMrrMax(e.target.value)} />
          <Input type="number" placeholder="LTV mínimo" value={ltvMin} onChange={(e) => setLtvMin(e.target.value)} />
          <Input type="number" placeholder="LTV máximo" value={ltvMax} onChange={(e) => setLtvMax(e.target.value)} />
          <Input type="number" placeholder="Proj. mínima" value={projectedMin} onChange={(e) => setProjectedMin(e.target.value)} />
          <Input type="number" placeholder="Proj. máxima" value={projectedMax} onChange={(e) => setProjectedMax(e.target.value)} />
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="metric-card"><p className="text-sm text-muted-foreground">Clientes no filtro</p><p className="mt-1 font-mono text-2xl font-semibold">{sortedClients.length}</p></div>
        <div className="metric-card"><p className="text-sm text-muted-foreground">Ativos</p><p className="mt-1 font-mono text-2xl font-semibold text-success">{stats.active}</p></div>
        <div className="metric-card"><p className="text-sm text-muted-foreground">Trial</p><p className="mt-1 font-mono text-2xl font-semibold text-warning">{stats.trial}</p></div>
        <div className="metric-card"><p className="text-sm text-muted-foreground">Churned</p><p className="mt-1 font-mono text-2xl font-semibold text-destructive">{stats.churned}</p></div>
        <div className="metric-card"><p className="text-sm text-muted-foreground">Inadimplentes</p><p className="mt-1 font-mono text-2xl font-semibold text-destructive">{stats.overdueClients}</p></div>
        <div className="metric-card"><p className="text-sm text-muted-foreground">Receita projetada</p><p className="mt-1 font-mono text-2xl font-semibold text-primary">{formatCurrency(stats.projectedRevenue)}</p></div>
      </div>

      <div className="metric-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          {sortedClients.length > 0 ? (
            <table className="data-table">
              <thead className="bg-muted/50">
                <tr>
                  <th>
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort("name")}>Cliente<ArrowUpDown className="h-3 w-3" /></button>
                  </th>
                  {columns.plan && <th>Plano & Ciclo</th>}
                  {columns.products && <th>Produtos</th>}
                  {columns.mrr && <th><button className="inline-flex items-center gap-1" onClick={() => toggleSort("mrr")}>MRR<ArrowUpDown className="h-3 w-3" /></button></th>}
                  {columns.status && <th>Status</th>}
                  {columns.health && <th>Saúde</th>}
                  {columns.ltv && <th><button className="inline-flex items-center gap-1" onClick={() => toggleSort("ltv")}>LTV / Aberto<ArrowUpDown className="h-3 w-3" /></button></th>}
                  {columns.projected && <th><button className="inline-flex items-center gap-1" onClick={() => toggleSort("projected")}>Receita Projetada<ArrowUpDown className="h-3 w-3" /></button></th>}
                  {columns.contract && <th><button className="inline-flex items-center gap-1" onClick={() => toggleSort("renewal")}>Contrato & Renovação<ArrowUpDown className="h-3 w-3" /></button></th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedClients.map((client) => {
                  const subscriptionLabels = client.subscriptions?.map((subscription) => (
                    `${subscription.product?.name || "Produto"} / ${subscription.plan?.name || "Plano"}`
                  )) || [];
                  const productLabels = client.subscriptions?.length
                    ? client.subscriptions.map((subscription) => subscription.product?.name).filter(Boolean)
                    : client.products || [];

                  return (
                    <tr key={client.id}>
                      <td className="font-medium">
                        <button
                          type="button"
                          className="text-left font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                          onClick={() => {
                            setDetailClient(client);
                            setDetailOpen(true);
                          }}
                        >
                          {formatClientName(client.name)}
                        </button>
                        <p className="text-xs text-muted-foreground">{client.email || "Sem e-mail"}</p>
                      </td>

                      {columns.plan && (
                        <td>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {subscriptionLabels.length > 0
                                ? subscriptionLabels.join(" + ")
                                : client.plan?.name || "Sem Plano"}
                            </span>
                            <span className="text-xs text-muted-foreground">{client.billing_cycle || "monthly"}</span>
                          </div>
                        </td>
                      )}

                      {columns.products && (
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {productLabels.map((prod) => (
                              <span key={prod} className="inline-flex items-center rounded-sm border border-border bg-muted px-2 py-0.5 text-xs font-medium">
                                {prod}
                              </span>
                            ))}
                            {!productLabels.length && <span className="text-xs text-muted-foreground">-</span>}
                          </div>
                        </td>
                      )}

                      {columns.mrr && (
                        <td>
                          <p className="font-mono">{formatCurrency(client.normalizedMrr)}</p>
                          <p className="text-xs text-muted-foreground">Contrato: {formatCurrency(client.mrr)}</p>
                        </td>
                      )}

                      {columns.status && (
                        <td>
                          <ClientStatusBadge status={client.calculatedStatus || client.status} />
                        </td>
                      )}

                      {columns.health && (
                        <td>
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "inline-flex w-fit items-center rounded-sm border px-2 py-0.5 text-xs font-semibold",
                              client.healthLabel === "saudavel" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                              client.healthLabel === "atencao" && "border-amber-200 bg-amber-50 text-amber-700",
                              client.healthLabel === "critico" && "border-red-200 bg-red-50 text-red-700",
                            )}>
                              {client.healthLabel === "saudavel" ? "Saudável" : client.healthLabel === "atencao" ? "Atenção" : "Crítico"}
                            </span>
                            {client.inadimplente && <span className="text-xs font-medium text-destructive">Inadimplência real</span>}
                          </div>
                        </td>
                      )}

                      {columns.ltv && (
                        <td>
                          <p className="font-mono">{formatCurrency(client.ltvReceived)}</p>
                          <p className="text-xs text-muted-foreground">Aberto: {formatCurrency(client.openAmount)}</p>
                          <p className="text-xs text-muted-foreground">Atrasado: {formatCurrency(client.overdueAmount)}</p>
                        </td>
                      )}

                      {columns.projected && (
                        <td className="font-mono">{formatCurrency(client.projectedRevenue)}</td>
                      )}

                      {columns.contract && (
                        <td>
                          <p className="text-xs text-muted-foreground">Fim: {client.contractEndDate ? format(client.contractEndDate, "dd/MM/yyyy") : "-"}</p>
                          <p className={cn(
                            "text-sm font-semibold",
                            (client.renewInDays ?? 999) <= 30 && "text-amber-700",
                            (client.renewInDays ?? -1) < 0 && "text-destructive",
                          )}>
                            {client.status === "churned"
                              ? "Cancelado"
                              : client.renewInDays === null
                                ? "Recorrente"
                                : client.renewInDays < 0
                                  ? `Vencido (${Math.abs(client.renewInDays)}d)`
                                  : `${client.renewInDays}d`}
                          </p>
                        </td>
                      )}

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
      <ClientDetailsModal client={detailClient} invoices={invoices as Invoice[] | null} open={detailOpen} onOpenChange={setDetailOpen} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {formatClientName(deleteTarget?.name)}? Esta ação não pode ser desfeita.
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
