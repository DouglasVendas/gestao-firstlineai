import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  CreditCard,
  Database,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Users,
  TrendingUp,
  CalendarClock,
  CircleDollarSign,
} from "lucide-react";
import { usePageTitle } from "@/contexts/PageTitleContext";
import {
  backofficeApi,
  type AlertSummary,
  type AuditLogItem,
  type BackofficeAlert,
  type BillingCompany,
  type BillingEvent,
  type BillingSummary,
  type Company,
  type CompanyDetail,
  type InternalUser,
  type Plan,
  type StripeEvent,
  type StripePurchase,
} from "@/lib/backofficeApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

const defaultEmail = "douglasvslopes@gmail.com";
const pageSize = 100;
type Section = "companies" | "plans" | "finance" | "monitoring";
type SavedView =
  | "all"
  | "risk"
  | "renew_30d"
  | "payment_issues"
  | "upsell"
  | "missing_config"
  | "trial_conversion";

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function fmtDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function calendarLabel(google?: boolean, microsoft?: boolean) {
  if (google && microsoft) return "Google + Microsoft";
  if (google) return "Google";
  if (microsoft) return "Microsoft";
  return "-";
}

function billingCycleLabel(value?: string) {
  if (value === "monthly") return "Mensal";
  if (value === "yearly") return "Anual";
  if (value === "trial") return "Trial";
  if (value === "manual") return "Manual";
  return "-";
}

function billingHealthLabel(value?: string) {
  const labels: Record<string, string> = {
    ok: "OK",
    not_configured: "Não configurado",
    trial: "Trial",
    trial_expiring: "Trial expirando",
    due_soon: "Vence em breve",
    overdue: "Atrasado",
    payment_failed: "Falha no pagamento",
    canceling: "Cancelando",
    canceled: "Cancelado",
    manual_review: "Revisar",
  };
  return labels[value || ""] || value || "-";
}

function accountStatusLabel(value?: string) {
  const labels: Record<string, string> = {
    active: "Ativo",
    inactive: "Inativo",
    suspended: "Suspenso",
    blocked: "Bloqueado",
    trial: "Trial",
  };
  return labels[(value || "").toLowerCase()] || value || "Sem status";
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{message}</div>;
}

type CompanyWithSignals = Company & {
  billing?: BillingCompany | null;
  alerts?: BackofficeAlert[];
  healthLabel: "saudavel" | "atencao" | "critico";
  healthScore: number;
  billingStatus: string;
  renewalInDays: number | null;
  usageDrop: boolean;
  upsellOpportunity: boolean;
  incomplete: {
    cnpj: boolean;
    email: boolean;
    phone: boolean;
    plan: boolean;
    billing: boolean;
  };
};

function MetricTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export default function Backoffice() {
  const { setPageTitle } = usePageTitle();
  const { toast } = useToast();
  const [section, setSection] = useState<Section>("companies");
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [internalUser, setInternalUser] = useState<InternalUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const [health, setHealth] = useState<{ database: string; tables: Record<string, number | null> } | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [companyStatusFilter, setCompanyStatusFilter] = useState("all");
  const [companyPlanFilter, setCompanyPlanFilter] = useState("all");
  const [companyBillingFilter, setCompanyBillingFilter] = useState("all");
  const [companyUsageFilter, setCompanyUsageFilter] = useState("all");
  const [companyRiskFilter, setCompanyRiskFilter] = useState("all");
  const [companyCommercialFilter, setCompanyCommercialFilter] = useState("all");
  const [companyIncompleteFilter, setCompanyIncompleteFilter] = useState("all");
  const [companySavedView, setCompanySavedView] = useState<SavedView>("all");
  const [companySortBy, setCompanySortBy] = useState<"name" | "plan" | "users" | "created_at" | "status" | "mrr" | "usage">("name");
  const [companySortDirection, setCompanySortDirection] = useState<"asc" | "desc">("asc");
  const [companyPage, setCompanyPage] = useState(1);

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyDetail, setCompanyDetail] = useState<CompanyDetail | null>(null);
  const [companyBilling, setCompanyBilling] = useState<BillingCompany | null>(null);
  const [companyBillingEvents, setCompanyBillingEvents] = useState<BillingEvent[]>([]);
  const [companyStripeEvents, setCompanyStripeEvents] = useState<StripeEvent[]>([]);
  const [companyStripePurchases, setCompanyStripePurchases] = useState<StripePurchase[]>([]);
  const [companyAlerts, setCompanyAlerts] = useState<BackofficeAlert[]>([]);
  const [companyAuditLog, setCompanyAuditLog] = useState<AuditLogItem[]>([]);
  const [selectedCompanyUser, setSelectedCompanyUser] = useState<NonNullable<CompanyDetail["users"]>[number] | null>(null);
  const [isLoadingCompanyDetail, setIsLoadingCompanyDetail] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: "active", reason: "" });
  const [planForm, setPlanForm] = useState({ subscriptionId: "", expirationDate: "", reason: "" });
  const [limitsForm, setLimitsForm] = useState({ maxActiveUsers: "", monthlyAnalysisLimit: "", reason: "" });
  const [billingForm, setBillingForm] = useState({
    contractedSeats: "",
    unitPrice: "",
    billingCycle: "monthly",
    discountType: "none",
    discountValue: "",
    discountExpiresAt: "",
    reason: "",
  });
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isSavingLimits, setIsSavingLimits] = useState(false);
  const [isSavingBilling, setIsSavingBilling] = useState(false);

  const [userActionLinkId, setUserActionLinkId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingItems, setBillingItems] = useState<BillingCompany[]>([]);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [isSyncingBilling, setIsSyncingBilling] = useState(false);
  const [alerts, setAlerts] = useState<BackofficeAlert[]>([]);
  const [alertsSummary, setAlertsSummary] = useState<AlertSummary>({ high: 0, medium: 0, low: 0, total: 0 });
  const [auditLog, setAuditLog] = useState<AuditLogItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [backendMessage, setBackendMessage] = useState("");

  useEffect(() => {
    setPageTitle("Backoffice", "Operação interna FirstLine AI");
  }, [setPageTitle]);

  async function loadAllCompanies() {
    let page = 1;
    let total = 1;
    const items: Company[] = [];

    while (items.length < total && page <= 20) {
      const response = await backofficeApi.companies(page, pageSize);
      total = response.pagination.total || 0;
      items.push(...(response.items || []));
      page += 1;
    }

    return items;
  }

  async function loadData(activeSection = section) {
    setIsLoadingData(true);
    setBackendMessage("");
    try {
      const healthResponse = await backofficeApi.health();
      setHealth({ database: healthResponse.database, tables: healthResponse.tables });

      if (activeSection === "companies") {
        const [companiesRows, billingResponse, alertsResponse, plansResponse] = await Promise.all([
          loadAllCompanies(),
          backofficeApi.billingOverview().catch(() => null),
          backofficeApi.alerts().catch(() => null),
          backofficeApi.plans().catch(() => null),
        ]);
        setCompanies(companiesRows);
        if (billingResponse) {
          setBillingItems(billingResponse.items || []);
          setBillingSummary(billingResponse.summary || null);
        }
        if (alertsResponse) {
          setAlerts(alertsResponse.items || []);
          setAlertsSummary(alertsResponse.summary || { high: 0, medium: 0, low: 0, total: 0 });
        }
        if (plansResponse) {
          setPlans(plansResponse.plans || []);
        }
      }
      if (activeSection === "plans") {
        const response = await backofficeApi.plans();
        setPlans(response.plans || []);
        setBackendMessage(response.message || "");
      }
      if (activeSection === "finance") {
        const response = await backofficeApi.billingOverview();
        setBillingItems(response.items || []);
        setBillingSummary(response.summary || null);
      }
      if (activeSection === "monitoring") {
        const [alertsResponse, auditResponse] = await Promise.all([backofficeApi.alerts(), backofficeApi.auditLog(1, 20)]);
        setAlerts(alertsResponse.items || []);
        setAlertsSummary(alertsResponse.summary || { high: 0, medium: 0, low: 0, total: 0 });
        setAuditLog(auditResponse.items || []);
      }
    } finally {
      setIsLoadingData(false);
    }
  }

  useEffect(() => {
    backofficeApi
      .me()
      .then(async (response) => {
        setInternalUser(response.user);
        await loadData("companies");
      })
      .catch(() => undefined)
      .finally(() => setIsCheckingSession(false));
  }, []);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsLoggingIn(true);
    try {
      const response = await backofficeApi.login(email, password);
      setInternalUser(response.user);
      setPassword("");
      await loadData("companies");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao autenticar no backoffice");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function switchSection(next: Section) {
    setSection(next);
    if (internalUser) await loadData(next);
  }

  async function handleSyncBilling() {
    setIsSyncingBilling(true);
    setBackendMessage("");
    try {
      const response = await backofficeApi.syncBilling();
      setBillingItems(response.items || []);
      setBillingSummary(response.summary || null);
      setBackendMessage(response.created ? `${response.created} previsões financeiras criadas no Supabase.` : "Todas as empresas já tinham previsão financeira.");
    } catch (err) {
      setBackendMessage(err instanceof Error ? err.message : "Falha ao sincronizar previsões financeiras.");
    } finally {
      setIsSyncingBilling(false);
    }
  }

  async function handleUserStatus(link: NonNullable<CompanyDetail["users"]>[number], status: "ACTIVE" | "INACTIVE" | "SUSPENDED") {
    if (!selectedCompany || !link.link_id) return;
    const reason = status === "ACTIVE" ? "" : window.prompt(`Motivo para alterar status para ${status}:`) || "";
    if (status !== "ACTIVE" && !reason.trim()) return;
    setUserActionLinkId(link.link_id || null);
    try {
      await backofficeApi.updateUserStatus(link.link_id, { status, reason: reason || undefined });
      await Promise.all([refreshSelectedCompany(selectedCompany.id), loadData("companies")]);
      toast({ title: "Status do usuário atualizado", description: `${link.name || "Usuário"} agora está ${status}.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Falha ao atualizar usuário", description: err instanceof Error ? err.message : "Erro inesperado" });
    } finally {
      setUserActionLinkId(null);
    }
  }

  async function handleUserRole(link: NonNullable<CompanyDetail["users"]>[number], role: string) {
    if (!selectedCompany || !link.link_id) return;
    const reason = window.prompt("Motivo da mudança de papel (auditoria):") || "";
    setUserActionLinkId(link.link_id || null);
    try {
      await backofficeApi.updateUserRole(link.link_id, { role, reason: reason || undefined });
      await Promise.all([refreshSelectedCompany(selectedCompany.id), loadData("companies")]);
      toast({ title: "Papel atualizado", description: `${link.name || "Usuário"} atualizado para ${role}.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Falha ao atualizar papel", description: err instanceof Error ? err.message : "Erro inesperado" });
    } finally {
      setUserActionLinkId(null);
    }
  }

  async function handleUserOnboarding(link: NonNullable<CompanyDetail["users"]>[number], completed: boolean) {
    if (!selectedCompany || !link.link_id) return;
    const reason = window.prompt(completed ? "Motivo para marcar onboarding como concluído:" : "Motivo para reabrir onboarding:") || "";
    setUserActionLinkId(link.link_id || null);
    try {
      await backofficeApi.updateUserOnboarding(link.link_id, { completed, reason: reason || undefined });
      await Promise.all([refreshSelectedCompany(selectedCompany.id), loadData("companies")]);
      toast({ title: "Onboarding atualizado", description: `${link.name || "Usuário"} ${completed ? "concluiu" : "voltou para pendente"}.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Falha ao atualizar onboarding", description: err instanceof Error ? err.message : "Erro inesperado" });
    } finally {
      setUserActionLinkId(null);
    }
  }

  async function handleRemoveUserLink(link: NonNullable<CompanyDetail["users"]>[number]) {
    if (!selectedCompany || !link.link_id) return;
    const confirmed = window.confirm(`Remover vínculo de ${link.name || "usuário"} com ${companyDetail?.name || "empresa"}?`);
    if (!confirmed) return;
    const reason = window.prompt("Motivo da remoção (obrigatório):") || "";
    if (!reason.trim()) return;
    setUserActionLinkId(link.link_id || null);
    try {
      await backofficeApi.removeUserLink(link.link_id, reason);
      await Promise.all([refreshSelectedCompany(selectedCompany.id), loadData("companies")]);
      toast({ title: "Vínculo removido", description: "Usuário desvinculado da empresa com sucesso." });
      setSelectedCompanyUser(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Falha ao remover vínculo", description: err instanceof Error ? err.message : "Erro inesperado" });
    } finally {
      setUserActionLinkId(null);
    }
  }

  async function refreshSelectedCompany(companyId: string) {
    const detail = await backofficeApi.company(companyId);
    setCompanyDetail(detail.company || null);
    setCompanyBilling(detail.billing || null);
    setCompanyBillingEvents(detail.billing_events || []);
    setCompanyStripeEvents(detail.stripe_events || []);
    setCompanyStripePurchases(detail.stripe_purchases || []);
    setCompanyAlerts(detail.alerts || []);
    setCompanyAuditLog(detail.audit_log || []);
  }

  async function handleOpenCompany(company: Company) {
    setSelectedCompany(company);
    setIsLoadingCompanyDetail(true);
    try {
      await refreshSelectedCompany(company.id);
    } catch (err) {
      setBackendMessage(err instanceof Error ? err.message : "Falha ao carregar detalhe da empresa");
    } finally {
      setIsLoadingCompanyDetail(false);
    }
  }

  useEffect(() => {
    if (!companyDetail) return;
    setStatusForm({
      status: String(companyDetail.account_status || "active").toLowerCase(),
      reason: "",
    });
    setPlanForm({
      subscriptionId: companyDetail.plan_id || "",
      expirationDate: companyDetail.expiration_date ? String(companyDetail.expiration_date).slice(0, 10) : "",
      reason: "",
    });
    setLimitsForm({
      maxActiveUsers: companyDetail.max_active_users !== undefined && companyDetail.max_active_users !== null ? String(companyDetail.max_active_users) : "",
      monthlyAnalysisLimit: companyDetail.monthly_analysis_limit !== undefined && companyDetail.monthly_analysis_limit !== null ? String(companyDetail.monthly_analysis_limit) : "",
      reason: "",
    });
  }, [companyDetail]);

  useEffect(() => {
    setBillingForm({
      contractedSeats: companyBilling?.contracted_seats !== undefined && companyBilling?.contracted_seats !== null ? String(companyBilling.contracted_seats) : "",
      unitPrice: companyBilling?.unit_price !== undefined && companyBilling?.unit_price !== null ? String(companyBilling.unit_price) : "",
      billingCycle: companyBilling?.billing_cycle || "monthly",
      discountType: companyBilling?.discount_type || "none",
      discountValue: companyBilling?.discount_value !== undefined && companyBilling?.discount_value !== null ? String(companyBilling.discount_value) : "",
      discountExpiresAt: companyBilling?.discount_expires_at ? String(companyBilling.discount_expires_at).slice(0, 10) : "",
      reason: "",
    });
  }, [companyBilling]);

  async function handleSaveStatus() {
    if (!selectedCompany) return;
    setIsSavingStatus(true);
    try {
      await backofficeApi.updateCompanyStatus(selectedCompany.id, {
        status: statusForm.status,
        reason: statusForm.reason || undefined,
      });
      await Promise.all([refreshSelectedCompany(selectedCompany.id), loadData("companies")]);
      setStatusForm((prev) => ({ ...prev, reason: "" }));
      toast({ title: "Status atualizado", description: "Status da empresa salvo com sucesso." });
    } catch (err) {
      toast({ variant: "destructive", title: "Falha ao atualizar status", description: err instanceof Error ? err.message : "Erro inesperado" });
    } finally {
      setIsSavingStatus(false);
    }
  }

  async function handleSavePlan() {
    if (!selectedCompany || !planForm.subscriptionId) return;
    setIsSavingPlan(true);
    try {
      await backofficeApi.updateCompanySubscription(selectedCompany.id, {
        subscription_id: planForm.subscriptionId,
        expiration_date: planForm.expirationDate || null,
        reason: planForm.reason || undefined,
      });
      await Promise.all([refreshSelectedCompany(selectedCompany.id), loadData("companies")]);
      setPlanForm((prev) => ({ ...prev, reason: "" }));
      toast({ title: "Plano atualizado", description: "Plano da empresa atualizado no backoffice." });
    } catch (err) {
      toast({ variant: "destructive", title: "Falha ao atualizar plano", description: err instanceof Error ? err.message : "Erro inesperado" });
    } finally {
      setIsSavingPlan(false);
    }
  }

  async function handleSaveLimits() {
    if (!selectedCompany) return;
    setIsSavingLimits(true);
    try {
      await backofficeApi.updateCompanyLimits(selectedCompany.id, {
        max_active_users: limitsForm.maxActiveUsers === "" ? null : Number(limitsForm.maxActiveUsers),
        monthly_analysis_limit: limitsForm.monthlyAnalysisLimit === "" ? null : Number(limitsForm.monthlyAnalysisLimit),
        reason: limitsForm.reason || undefined,
      });
      await Promise.all([refreshSelectedCompany(selectedCompany.id), loadData("companies")]);
      setLimitsForm((prev) => ({ ...prev, reason: "" }));
      toast({ title: "Limites atualizados", description: "Limites operacionais atualizados." });
    } catch (err) {
      toast({ variant: "destructive", title: "Falha ao atualizar limites", description: err instanceof Error ? err.message : "Erro inesperado" });
    } finally {
      setIsSavingLimits(false);
    }
  }

  async function handleSaveBilling() {
    if (!selectedCompany) return;
    setIsSavingBilling(true);
    try {
      await backofficeApi.updateBilling(selectedCompany.id, {
        contracted_seats: billingForm.contractedSeats === "" ? undefined : Number(billingForm.contractedSeats),
        unit_price: billingForm.unitPrice === "" ? undefined : Number(billingForm.unitPrice),
        billing_cycle: billingForm.billingCycle as BillingCompany["billing_cycle"],
        discount_type: billingForm.discountType as BillingCompany["discount_type"],
        discount_value: billingForm.discountValue === "" ? 0 : Number(billingForm.discountValue),
        discount_expires_at: billingForm.discountExpiresAt || null,
        reason: billingForm.reason || undefined,
      });
      await Promise.all([refreshSelectedCompany(selectedCompany.id), loadData("companies")]);
      setBillingForm((prev) => ({ ...prev, reason: "" }));
      toast({ title: "Billing atualizado", description: "Parâmetros financeiros salvos com sucesso." });
    } catch (err) {
      toast({ variant: "destructive", title: "Falha ao atualizar billing", description: err instanceof Error ? err.message : "Erro inesperado" });
    } finally {
      setIsSavingBilling(false);
    }
  }

  const billingByCompany = useMemo(() => {
    const map = new Map<string, BillingCompany>();
    billingItems.forEach((item) => map.set(String(item.firstline_company_id), item));
    return map;
  }, [billingItems]);

  const alertsByCompany = useMemo(() => {
    const map = new Map<string, BackofficeAlert[]>();
    alerts.forEach((item) => {
      const key = String(item.company_id);
      const current = map.get(key) || [];
      current.push(item);
      map.set(key, current);
    });
    return map;
  }, [alerts]);

  const companiesWithSignals = useMemo<CompanyWithSignals[]>(() => {
    return companies.map((company) => {
      const billing = billingByCompany.get(company.id) || null;
      const companyAlerts = alertsByCompany.get(company.id) || [];
      const analyses30 = Number(company.analyses_30d || 0);
      const analysesCurrent = Number(company.analyses_current_month || 0);
      const analysesPrevious = Number(company.analyses_previous_month || 0);
      const usageDrop = analysesPrevious > 0 && analysesCurrent < analysesPrevious * 0.5;
      const activeUsers = Number(company.active_users_count || 0);
      const contracted = Number(billing?.contracted_seats || company.max_active_users || 0);

      let healthScore = 100;
      const accountStatus = String(company.account_status || "active").toLowerCase();
      if (accountStatus !== "active") healthScore -= 30;
      const billingHealth = String(billing?.billing_health || "not_configured");
      if (["overdue", "payment_failed"].includes(billingHealth)) healthScore -= 30;
      else if (["due_soon", "trial_expiring", "manual_review", "not_configured"].includes(billingHealth)) healthScore -= 10;
      if (analyses30 === 0) healthScore -= 20;
      if (usageDrop) healthScore -= 15;
      if (contracted > 0 && activeUsers > contracted) healthScore -= 10;
      healthScore = Math.max(0, Math.min(100, healthScore));

      const healthLabel: CompanyWithSignals["healthLabel"] =
        healthScore >= 75 ? "saudavel" : healthScore >= 45 ? "atencao" : "critico";

      const expirationDate = company.expiration_date ? new Date(company.expiration_date) : null;
      const renewalInDays = expirationDate
        ? Math.ceil((expirationDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        : null;

      const incomplete = {
        cnpj: !company.cnpj,
        email: !company.contact_email,
        phone: !company.phone,
        plan: !company.plan_name,
        billing: !billing,
      };

      const upsellOpportunity =
        (contracted > 0 && activeUsers >= contracted) ||
        (analyses30 >= 30 && ["starter", "basic", "free", "trial"].some((term) => (company.plan_name || "").toLowerCase().includes(term)));

      return {
        ...company,
        billing,
        alerts: companyAlerts,
        healthLabel,
        healthScore,
        billingStatus: billing?.billing_health || "not_configured",
        renewalInDays,
        usageDrop,
        upsellOpportunity,
        incomplete,
      };
    });
  }, [companies, billingByCompany, alertsByCompany]);

  const filteredCompanies = useMemo(() => {
    const term = companySearch.trim().toLowerCase();
    return companiesWithSignals.filter((company) => {
      const matchesSearch =
        !term ||
        [company.name, company.cnpj, company.contact_email, company.plan_name]
          .join(" ")
          .toLowerCase()
          .includes(term);

      const status = (company.account_status || "").toLowerCase();
      const planLower = (company.plan_name || "").toLowerCase();
      const billing = company.billing;

      const matchesStatus = companyStatusFilter === "all" || status === companyStatusFilter;

      let matchesPlan = companyPlanFilter === "all";
      if (companyPlanFilter === "no_plan") matchesPlan = !company.plan_name;
      if (companyPlanFilter === "trial") matchesPlan = planLower.includes("trial") || billing?.billing_cycle === "trial";
      if (companyPlanFilter === "free") matchesPlan = planLower.includes("free");
      if (companyPlanFilter === "paid") matchesPlan = !!company.plan_name && !planLower.includes("free") && !planLower.includes("trial");
      if (companyPlanFilter === "enterprise") matchesPlan = planLower.includes("enterprise");
      if (!["all", "no_plan", "trial", "free", "paid", "enterprise"].includes(companyPlanFilter)) {
        matchesPlan = planLower === companyPlanFilter;
      }

      let matchesBilling = companyBillingFilter === "all";
      if (companyBillingFilter === "billing_ok") matchesBilling = company.billingStatus === "ok";
      if (companyBillingFilter === "due_7d") matchesBilling = company.billingStatus === "due_soon";
      if (companyBillingFilter === "due_30d") matchesBilling = (company.renewalInDays ?? 999) <= 30 && (company.renewalInDays ?? -1) >= 0;
      if (companyBillingFilter === "overdue") matchesBilling = company.billingStatus === "overdue";
      if (companyBillingFilter === "payment_failed") matchesBilling = company.billingStatus === "payment_failed";
      if (companyBillingFilter === "no_billing") matchesBilling = !billing || company.billingStatus === "not_configured";
      if (companyBillingFilter === "discount_active") matchesBilling = Number(billing?.discount_value || 0) > 0;
      if (companyBillingFilter === "discount_expiring") {
        const daysToDiscount = billing?.discount_expires_at
          ? Math.ceil((new Date(billing.discount_expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
          : null;
        matchesBilling = daysToDiscount !== null && daysToDiscount >= 0 && daysToDiscount <= 30;
      }

      const analyses7 = Number(company.analyses_7d || 0);
      const analyses30 = Number(company.analyses_30d || 0);
      const contracted = Number(company.billing?.contracted_seats || company.max_active_users || 0);
      const activeUsers = Number(company.active_users_count || 0);
      let matchesUsage = companyUsageFilter === "all";
      if (companyUsageFilter === "no_usage_7d") matchesUsage = analyses7 === 0;
      if (companyUsageFilter === "no_usage_30d") matchesUsage = analyses30 === 0;
      if (companyUsageFilter === "high_usage") matchesUsage = analyses30 >= 30;
      if (companyUsageFilter === "low_usage") matchesUsage = analyses30 > 0 && analyses30 < 10;
      if (companyUsageFilter === "usage_drop") matchesUsage = company.usageDrop;
      if (companyUsageFilter === "active_above_seats") matchesUsage = contracted > 0 && activeUsers > contracted;

      let matchesRisk = companyRiskFilter === "all";
      if (companyRiskFilter === "critical") matchesRisk = company.healthLabel === "critico";
      if (companyRiskFilter === "attention") matchesRisk = company.healthLabel === "atencao";
      if (companyRiskFilter === "healthy") matchesRisk = company.healthLabel === "saudavel";
      if (companyRiskFilter === "manual_review") matchesRisk = company.billingStatus === "manual_review";
      if (companyRiskFilter === "with_alert") matchesRisk = (company.alerts || []).length > 0;

      const createdDays = Math.ceil((Date.now() - new Date(company.created_at || Date.now()).getTime()) / (24 * 60 * 60 * 1000));
      let matchesCommercial = companyCommercialFilter === "all";
      if (companyCommercialFilter === "upsell") matchesCommercial = company.upsellOpportunity;
      if (companyCommercialFilter === "renewal_30d") matchesCommercial = (company.renewalInDays ?? 999) <= 30 && (company.renewalInDays ?? -1) >= 0;
      if (companyCommercialFilter === "trial_expiring") matchesCommercial = company.billingStatus === "trial_expiring";
      if (companyCommercialFilter === "new_client") matchesCommercial = createdDays <= 30;
      if (companyCommercialFilter === "old_client") matchesCommercial = createdDays >= 365;

      let matchesIncomplete = companyIncompleteFilter === "all";
      if (companyIncompleteFilter === "missing_cnpj") matchesIncomplete = company.incomplete.cnpj;
      if (companyIncompleteFilter === "missing_email") matchesIncomplete = company.incomplete.email;
      if (companyIncompleteFilter === "missing_phone") matchesIncomplete = company.incomplete.phone;
      if (companyIncompleteFilter === "missing_plan") matchesIncomplete = company.incomplete.plan;
      if (companyIncompleteFilter === "missing_billing") matchesIncomplete = company.incomplete.billing;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPlan &&
        matchesBilling &&
        matchesUsage &&
        matchesRisk &&
        matchesCommercial &&
        matchesIncomplete
      );
    });
  }, [
    companiesWithSignals,
    companySearch,
    companyStatusFilter,
    companyPlanFilter,
    companyBillingFilter,
    companyUsageFilter,
    companyRiskFilter,
    companyCommercialFilter,
    companyIncompleteFilter,
  ]);

  const companyStatuses = useMemo(
    () => Array.from(new Set(companies.map((company) => (company.account_status || "").toLowerCase()).filter(Boolean))),
    [companies],
  );

  const companyPlans = useMemo(
    () => Array.from(new Set(companies.map((company) => (company.plan_name || "Sem plano").trim()).filter(Boolean))),
    [companies],
  );

  const sortedCompanies = useMemo(() => {
    const sorted = [...filteredCompanies];
    sorted.sort((a, b) => {
      const direction = companySortDirection === "asc" ? 1 : -1;

      if (companySortBy === "users") return ((a.active_users_count ?? 0) - (b.active_users_count ?? 0)) * direction;
      if (companySortBy === "created_at") {
        return ((a.created_at ? new Date(a.created_at).getTime() : 0) - (b.created_at ? new Date(b.created_at).getTime() : 0)) * direction;
      }
      if (companySortBy === "mrr") return ((a.billing?.expected_mrr ?? 0) - (b.billing?.expected_mrr ?? 0)) * direction;
      if (companySortBy === "usage") return ((a.analyses_30d ?? 0) - (b.analyses_30d ?? 0)) * direction;

      const aValue = companySortBy === "name" ? (a.name || "") : companySortBy === "plan" ? (a.plan_name || "") : (a.account_status || "");
      const bValue = companySortBy === "name" ? (b.name || "") : companySortBy === "plan" ? (b.plan_name || "") : (b.account_status || "");
      return aValue.localeCompare(bValue, "pt-BR") * direction;
    });
    return sorted;
  }, [filteredCompanies, companySortBy, companySortDirection]);

  const companiesPerPage = 10;
  const totalCompanyPages = Math.max(1, Math.ceil(sortedCompanies.length / companiesPerPage));
  const paginatedCompanies = useMemo(() => {
    const start = (companyPage - 1) * companiesPerPage;
    return sortedCompanies.slice(start, start + companiesPerPage);
  }, [sortedCompanies, companyPage]);

  const activeCompanies = filteredCompanies.filter((company) => (company.account_status || "").toLowerCase() === "active").length;

  const companyResultSummary = useMemo(() => {
    const projectedMrr = filteredCompanies.reduce((sum, item) => sum + Number(item.billing?.expected_mrr || 0), 0);
    const critical = filteredCompanies.filter((item) => item.healthLabel === "critico").length;
    const paymentIssues = filteredCompanies.filter((item) => ["overdue", "payment_failed"].includes(item.billingStatus)).length;
    return { projectedMrr, critical, paymentIssues };
  }, [filteredCompanies]);

  useEffect(() => {
    setCompanyPage(1);
  }, [
    companySearch,
    companyStatusFilter,
    companyPlanFilter,
    companyBillingFilter,
    companyUsageFilter,
    companyRiskFilter,
    companyCommercialFilter,
    companyIncompleteFilter,
    companySortBy,
    companySortDirection,
  ]);

  useEffect(() => {
    if (companyPage > totalCompanyPages) setCompanyPage(totalCompanyPages);
  }, [companyPage, totalCompanyPages]);

  function handleCompanySort(nextSort: "name" | "plan" | "users" | "created_at" | "status" | "mrr" | "usage") {
    if (companySortBy === nextSort) {
      setCompanySortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setCompanySortBy(nextSort);
    setCompanySortDirection("asc");
  }

  function applySavedView(view: SavedView) {
    setCompanySavedView(view);
    setCompanyStatusFilter("all");
    setCompanyPlanFilter("all");
    setCompanyBillingFilter("all");
    setCompanyUsageFilter("all");
    setCompanyRiskFilter("all");
    setCompanyCommercialFilter("all");
    setCompanyIncompleteFilter("all");

    if (view === "risk") {
      setCompanyRiskFilter("critical");
    }
    if (view === "renew_30d") {
      setCompanyCommercialFilter("renewal_30d");
    }
    if (view === "payment_issues") {
      setCompanyBillingFilter("overdue");
    }
    if (view === "upsell") {
      setCompanyCommercialFilter("upsell");
      setCompanyUsageFilter("high_usage");
    }
    if (view === "missing_config") {
      setCompanyIncompleteFilter("missing_billing");
    }
    if (view === "trial_conversion") {
      setCompanyPlanFilter("trial");
      setCompanyBillingFilter("due_30d");
    }
  }

  if (isCheckingSession) {
    return <div className="flex h-[360px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!internalUser) {
    return (
      <div className="mx-auto grid max-w-xl gap-6 py-10">
        <Card className="border-primary/20 bg-card/80">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Lock className="h-6 w-6" /></div>
            <CardTitle>Acesso interno FirstLine</CardTitle>
            <p className="text-sm text-muted-foreground">Use o mesmo login já existente. O e-mail precisa estar autorizado como usuário interno.</p>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleLogin}>
              <label className="grid gap-2 text-sm font-medium">E-mail<Input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" /></label>
              <label className="grid gap-2 text-sm font-medium">Senha<Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" autoFocus /></label>
              {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              <Button type="submit" disabled={isLoggingIn}>{isLoggingIn ? "Entrando..." : "Entrar no backoffice"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Operador</p><p className="mt-2 truncate font-semibold">{internalUser.email}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Permissão</p><Badge className="mt-2">{internalUser.role}</Badge></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Banco</p><p className="mt-2 font-semibold text-success">{health?.database || "conectado"}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Usuários internos</p><p className="mt-2 font-mono text-2xl font-semibold">{health?.tables?.internal_users ?? 0}</p></CardContent></Card>
      </div>

      <Tabs value={section} onValueChange={(value) => switchSection(value as Section)}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[760px]">
          <TabsTrigger value="companies"><Building2 className="mr-2 h-4 w-4" />Clientes</TabsTrigger>
          <TabsTrigger value="plans"><ShieldCheck className="mr-2 h-4 w-4" />Planos</TabsTrigger>
          <TabsTrigger value="finance"><CreditCard className="mr-2 h-4 w-4" />Financeiro</TabsTrigger>
          <TabsTrigger value="monitoring"><Activity className="mr-2 h-4 w-4" />Monitoramento</TabsTrigger>
        </TabsList>

        {backendMessage && <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-muted-foreground">{backendMessage}</div>}
        {isLoadingData && <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando backoffice...</div>}

        <TabsContent value="companies" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Clientes no resultado</p><p className="mt-2 font-mono text-3xl font-semibold">{filteredCompanies.length}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Clientes ativos</p><p className="mt-2 font-mono text-3xl font-semibold text-success">{activeCompanies}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Em risco crítico</p><p className="mt-2 font-mono text-3xl font-semibold text-destructive">{companyResultSummary.critical}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Problemas de pagamento</p><p className="mt-2 font-mono text-3xl font-semibold text-warning">{companyResultSummary.paymentIssues}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">MRR esperado</p><p className="mt-2 font-mono text-3xl font-semibold text-primary">{formatCurrency(companyResultSummary.projectedMrr)}</p></CardContent></Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            <Input placeholder="Buscar por empresa, CNPJ, e-mail ou plano" value={companySearch} onChange={(event) => setCompanySearch(event.target.value)} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={companySavedView} onChange={(event) => applySavedView(event.target.value as SavedView)}>
              <option value="all">Views salvas: todas</option>
              <option value="risk">Clientes em risco</option>
              <option value="renew_30d">Renovar nos próximos 30 dias</option>
              <option value="payment_issues">Pagamentos com problema</option>
              <option value="upsell">Alto uso / oportunidade upsell</option>
              <option value="missing_config">Contas sem configuração</option>
              <option value="trial_conversion">Trials para converter</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={companyStatusFilter} onChange={(event) => setCompanyStatusFilter(event.target.value)}>
              <option value="all">Status da conta</option>
              {companyStatuses.map((status) => <option key={status} value={status}>{accountStatusLabel(status)}</option>)}
              <option value="blocked">Bloqueado</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={companyPlanFilter} onChange={(event) => setCompanyPlanFilter(event.target.value)}>
              <option value="all">Plano</option>
              <option value="no_plan">Sem plano</option>
              <option value="trial">Trial</option>
              <option value="free">Free</option>
              <option value="paid">Pago</option>
              <option value="enterprise">Enterprise</option>
              {companyPlans.map((plan) => <option key={plan} value={plan.toLowerCase()}>{plan}</option>)}
            </select>
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={companyBillingFilter} onChange={(event) => setCompanyBillingFilter(event.target.value)}>
              <option value="all">Financeiro</option>
              <option value="billing_ok">Billing ok</option>
              <option value="due_7d">Vence em 7 dias</option>
              <option value="due_30d">Vence em 30 dias</option>
              <option value="overdue">Atrasado</option>
              <option value="payment_failed">Falha no pagamento</option>
              <option value="no_billing">Sem billing configurado</option>
              <option value="discount_active">Com desconto ativo</option>
              <option value="discount_expiring">Desconto expirando</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={companyUsageFilter} onChange={(event) => setCompanyUsageFilter(event.target.value)}>
              <option value="all">Uso</option>
              <option value="no_usage_7d">Sem uso nos últimos 7 dias</option>
              <option value="no_usage_30d">Sem uso nos últimos 30 dias</option>
              <option value="high_usage">Alto uso</option>
              <option value="low_usage">Baixo uso</option>
              <option value="usage_drop">Queda de uso</option>
              <option value="active_above_seats">Ativos acima do contratado</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={companyRiskFilter} onChange={(event) => setCompanyRiskFilter(event.target.value)}>
              <option value="all">Risco</option>
              <option value="critical">Crítico</option>
              <option value="attention">Atenção</option>
              <option value="healthy">Saudável</option>
              <option value="manual_review">Requer revisão manual</option>
              <option value="with_alert">Com alerta aberto</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={companyCommercialFilter} onChange={(event) => setCompanyCommercialFilter(event.target.value)}>
              <option value="all">Comercial</option>
              <option value="upsell">Oportunidade de upsell</option>
              <option value="renewal_30d">Renovação próxima</option>
              <option value="trial_expiring">Trial expirando</option>
              <option value="new_client">Cliente novo</option>
              <option value="old_client">Cliente antigo</option>
            </select>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={companyIncompleteFilter} onChange={(event) => setCompanyIncompleteFilter(event.target.value)}>
              <option value="all">Dados incompletos</option>
              <option value="missing_cnpj">Sem CNPJ</option>
              <option value="missing_email">Sem e-mail</option>
              <option value="missing_phone">Sem telefone</option>
              <option value="missing_plan">Sem plano</option>
              <option value="missing_billing">Sem cobrança</option>
            </select>
            <Button variant="ghost" size="sm" onClick={() => {
              setCompanySearch("");
              applySavedView("all");
              setCompanySortBy("name");
              setCompanySortDirection("asc");
            }}>
              Limpar filtros
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {sortedCompanies.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><button type="button" onClick={() => handleCompanySort("name")}>Empresa</button></TableHead>
                      <TableHead><button type="button" onClick={() => handleCompanySort("plan")}>Plano / Ciclo</button></TableHead>
                      <TableHead><button type="button" onClick={() => handleCompanySort("users")}>Usuários</button></TableHead>
                      <TableHead><button type="button" onClick={() => handleCompanySort("usage")}>Uso 30d</button></TableHead>
                      <TableHead><button type="button" onClick={() => handleCompanySort("mrr")}>MRR</button></TableHead>
                      <TableHead><button type="button" onClick={() => handleCompanySort("status")}>Saúde</button></TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCompanies.map((company) => (
                      <TableRow key={company.id} className="hover:bg-muted/40" onDoubleClick={() => void handleOpenCompany(company)}>
                        <TableCell className="font-medium">
                          {company.name || "-"}
                          <p className="text-xs text-muted-foreground">{company.contact_email || "Sem e-mail"}</p>
                        </TableCell>
                        <TableCell>
                          {company.plan_name || "Sem plano"}
                          <p className="text-xs text-muted-foreground">{billingCycleLabel(company.billing?.billing_cycle || company.plan_payment_type)}</p>
                        </TableCell>
                        <TableCell>
                          {company.active_users_count ?? 0} ativos / {company.users_count ?? 0} totais
                          {(company.billing?.contracted_seats || company.max_active_users) ? (
                            <p className="text-xs text-muted-foreground">{company.billing?.contracted_seats || company.max_active_users} contratados</p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{company.analyses_30d ?? 0}</span>
                          <p className="text-xs text-muted-foreground">7d: {company.analyses_7d ?? 0}</p>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{formatCurrency(Number(company.billing?.expected_mrr || 0))}</span>
                          <p className="text-xs text-muted-foreground">{billingHealthLabel(company.billingStatus)}</p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              company.healthLabel === "saudavel"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : company.healthLabel === "atencao"
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-red-200 bg-red-50 text-red-700"
                            }
                          >
                            {company.healthLabel === "saudavel" ? "Saudável" : company.healthLabel === "atencao" ? "Atenção" : "Crítico"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => void handleOpenCompany(company)}>Ver detalhes</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState message="Nenhuma empresa encontrada com esses filtros." />
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" disabled={companyPage <= 1} onClick={() => setCompanyPage((prev) => Math.max(1, prev - 1))}>Anterior</Button>
            <span className="text-sm text-muted-foreground">Página {companyPage} de {totalCompanyPages}</span>
            <Button variant="outline" size="sm" disabled={companyPage >= totalCompanyPages} onClick={() => setCompanyPage((prev) => Math.min(totalCompanyPages, prev + 1))}>Próxima</Button>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card><CardContent className="p-0">{plans.length ? <Table><TableHeader><TableRow><TableHead>Plano</TableHead><TableHead>Tipo</TableHead><TableHead>Preço</TableHead><TableHead>Empresas</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{plans.map((plan) => <TableRow key={plan.id}><TableCell className="font-medium">{plan.name}<p className="text-xs text-muted-foreground">{plan.description || "-"}</p></TableCell><TableCell>{plan.subscription_type || "-"} / {plan.payment_type || "-"}</TableCell><TableCell>{formatCurrency(Number(plan.price || 0))}</TableCell><TableCell>{plan.companies_count ?? 0}</TableCell><TableCell><Badge variant="outline">{plan.status}</Badge></TableCell></TableRow>)}</TableBody></Table> : <EmptyState message="Nenhum plano retornado ainda." />}</CardContent></Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Gestão financeira SaaS</h2>
              <p className="text-sm text-muted-foreground">Previsão comercial no Supabase do backoffice. Pagamentos Stripe entram depois como confirmação.</p>
            </div>
            <Button onClick={handleSyncBilling} disabled={isSyncingBilling} variant="outline">
              {isSyncingBilling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Gerar previsões faltantes
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">MRR previsto</p><p className="mt-2 font-mono text-2xl font-semibold text-primary">{formatCurrency(billingSummary?.expected_mrr || 0)}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">ARR previsto</p><p className="mt-2 font-mono text-2xl font-semibold">{formatCurrency(billingSummary?.expected_arr || 0)}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Configuradas</p><p className="mt-2 font-mono text-2xl font-semibold text-success">{billingSummary?.configured_companies ?? 0}<span className="text-sm text-muted-foreground"> / {billingSummary?.total_companies ?? 0}</span></p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Atenção</p><p className="mt-2 font-mono text-2xl font-semibold text-warning">{(billingSummary?.due_soon || 0) + (billingSummary?.overdue || 0) + (billingSummary?.manual_review || 0)}</p></CardContent></Card>
          </div>
          <Card>
            <CardContent className="p-0">
              {billingItems.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Usuários</TableHead>
                      <TableHead>Receita Prevista</TableHead>
                      <TableHead>Próxima Cobrança</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingItems.map((item) => (
                      <TableRow key={item.firstline_company_id}>
                        <TableCell className="font-medium">
                          {item.firstline_company_name || "-"}
                          <p className="text-xs text-muted-foreground">{item.is_configured ? "Supabase configurado" : "Previsão ainda não salva"}</p>
                        </TableCell>
                        <TableCell>
                          {item.plan_name || item.firstline_plan_name || "Sem plano"}
                          <p className="text-xs text-muted-foreground">{billingCycleLabel(item.billing_cycle)} · {formatCurrency(Number(item.unit_price || 0))}/usuário</p>
                        </TableCell>
                        <TableCell>{item.contracted_seats ?? 0} contratados / {item.active_users_count ?? item.active_users_count_cached ?? 0} ativos</TableCell>
                        <TableCell>
                          <span className="font-mono">{formatCurrency(Number(item.expected_mrr || 0))}</span>
                          <p className="text-xs text-muted-foreground">ARR {formatCurrency(Number(item.expected_arr || 0))}</p>
                        </TableCell>
                        <TableCell>{fmtDate(item.next_billing_date)}</TableCell>
                        <TableCell><Badge variant={item.billing_health === "ok" ? "default" : "outline"}>{billingHealthLabel(item.billing_health)}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <EmptyState message="Nenhuma previsão financeira carregada ainda. Use a sincronização para criar a camada gerencial no Supabase." />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4"><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Alertas</p><p className="mt-2 font-mono text-3xl font-semibold">{alertsSummary.total}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Críticos</p><p className="mt-2 font-mono text-3xl font-semibold text-destructive">{alertsSummary.high}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Médios</p><p className="mt-2 font-mono text-3xl font-semibold text-warning">{alertsSummary.medium}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Baixos</p><p className="mt-2 font-mono text-3xl font-semibold">{alertsSummary.low}</p></CardContent></Card></div>
          <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Alertas</CardTitle></CardHeader><CardContent>{alerts.length ? alerts.map((alert) => <div key={`${alert.alert_code}-${alert.company_id}`} className="border-b border-border py-3 last:border-0"><Badge variant={alert.severity === "high" ? "destructive" : "outline"}>{alert.severity}</Badge><p className="mt-2 font-medium">{alert.message}</p><p className="text-sm text-muted-foreground">{alert.company_name}</p></div>) : <EmptyState message="Nenhum alerta no momento." />}</CardContent></Card><Card><CardHeader><CardTitle>Auditoria</CardTitle></CardHeader><CardContent>{auditLog.length ? auditLog.map((item) => <div key={item.id} className="border-b border-border py-3 last:border-0"><p className="font-medium">{item.action}</p><p className="text-sm text-muted-foreground">{fmtDate(item.created_at)} - {item.actor_email || "sistema"}</p></div>) : <EmptyState message="Nenhum evento de auditoria ainda." />}</CardContent></Card></div>
        </TabsContent>
      </Tabs>

      <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground"><Database className="mr-2 inline h-4 w-4" />Backoffice em modo Customer 360 com visão operacional, financeira, uso e riscos por cliente.</div>

      <Dialog open={!!selectedCompany} onOpenChange={(open) => {
        if (!open) {
          setSelectedCompany(null);
          setSelectedCompanyUser(null);
          setCompanyDetail(null);
          setCompanyBilling(null);
          setCompanyBillingEvents([]);
          setCompanyStripeEvents([]);
          setCompanyStripePurchases([]);
          setCompanyAlerts([]);
          setCompanyAuditLog([]);
        }
      }}>
        <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-[1200px]">
          <DialogHeader className="border-b border-border px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <DialogTitle className="text-2xl font-semibold">{companyDetail?.name || selectedCompany?.name || "Cliente"}</DialogTitle>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{accountStatusLabel(companyDetail?.account_status || selectedCompany?.account_status)}</Badge>
                  <span>{companyDetail?.plan_name || "Sem plano"}</span>
                  <span>{billingCycleLabel(companyBilling?.billing_cycle || companyDetail?.plan_payment_type)}</span>
                  <span>{companyDetail?.contact_email || "Sem e-mail"}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setStatusForm((prev) => ({ ...prev, status: "active" }))}>Ativar</Button>
                <Button size="sm" variant="outline" onClick={() => setStatusForm((prev) => ({ ...prev, status: "inactive" }))}>Inativar</Button>
                <Button size="sm" variant="outline" onClick={() => setStatusForm((prev) => ({ ...prev, status: "suspended" }))}>Suspender</Button>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(92vh-104px)]">
            {isLoadingCompanyDetail ? (
              <div className="flex h-[320px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6 p-6">
                <div className="grid gap-3 md:grid-cols-4">
                  <MetricTile
                    label="MRR esperado"
                    value={formatCurrency(Number(companyBilling?.expected_mrr || 0))}
                    hint="Receita mensal gerencial"
                  />
                  <MetricTile
                    label="ARR esperado"
                    value={formatCurrency(Number(companyBilling?.expected_arr || 0))}
                    hint="Receita anual gerencial"
                  />
                  <MetricTile
                    label="Próxima cobrança"
                    value={fmtDate(companyBilling?.next_billing_date)}
                    hint={billingHealthLabel(companyBilling?.billing_health)}
                  />
                  <MetricTile
                    label="Usuários"
                    value={`${companyDetail?.active_users_count ?? 0} / ${companyBilling?.contracted_seats || companyDetail?.max_active_users || 0}`}
                    hint="Ativos / contratados"
                  />
                </div>

                <section className="rounded-lg border border-border/70">
                  <div className="border-b border-border px-4 py-3">
                    <h3 className="font-semibold">Gestão operacional</h3>
                    <p className="text-xs text-muted-foreground">Campos editáveis conectados ao banco: status, plano, limites e billing.</p>
                  </div>
                  <div className="grid gap-4 p-4 lg:grid-cols-2">
                    <div className="space-y-3 rounded-md border border-border/70 p-3">
                      <p className="text-sm font-semibold">Status da conta</p>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={statusForm.status}
                        onChange={(event) => setStatusForm((prev) => ({ ...prev, status: event.target.value }))}
                      >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                        <option value="suspended">Suspenso</option>
                      </select>
                      <Input
                        placeholder="Motivo da alteração (auditoria)"
                        value={statusForm.reason}
                        onChange={(event) => setStatusForm((prev) => ({ ...prev, reason: event.target.value }))}
                      />
                      <Button size="sm" onClick={() => void handleSaveStatus()} disabled={isSavingStatus}>
                        {isSavingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Salvar status
                      </Button>
                    </div>

                    <div className="space-y-3 rounded-md border border-border/70 p-3">
                      <p className="text-sm font-semibold">Plano e expiração</p>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={planForm.subscriptionId}
                        onChange={(event) => setPlanForm((prev) => ({ ...prev, subscriptionId: event.target.value }))}
                      >
                        <option value="">Selecione um plano</option>
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>{plan.name}</option>
                        ))}
                      </select>
                      <Input
                        type="date"
                        value={planForm.expirationDate}
                        onChange={(event) => setPlanForm((prev) => ({ ...prev, expirationDate: event.target.value }))}
                      />
                      <Input
                        placeholder="Motivo da troca de plano"
                        value={planForm.reason}
                        onChange={(event) => setPlanForm((prev) => ({ ...prev, reason: event.target.value }))}
                      />
                      <Button size="sm" onClick={() => void handleSavePlan()} disabled={isSavingPlan || !planForm.subscriptionId}>
                        {isSavingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Salvar plano
                      </Button>
                    </div>

                    <div className="space-y-3 rounded-md border border-border/70 p-3">
                      <p className="text-sm font-semibold">Limites operacionais</p>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Limite de usuários ativos"
                        value={limitsForm.maxActiveUsers}
                        onChange={(event) => setLimitsForm((prev) => ({ ...prev, maxActiveUsers: event.target.value }))}
                      />
                      <Input
                        type="number"
                        min={0}
                        placeholder="Limite mensal de análises"
                        value={limitsForm.monthlyAnalysisLimit}
                        onChange={(event) => setLimitsForm((prev) => ({ ...prev, monthlyAnalysisLimit: event.target.value }))}
                      />
                      <Input
                        placeholder="Motivo da alteração de limite"
                        value={limitsForm.reason}
                        onChange={(event) => setLimitsForm((prev) => ({ ...prev, reason: event.target.value }))}
                      />
                      <Button size="sm" onClick={() => void handleSaveLimits()} disabled={isSavingLimits}>
                        {isSavingLimits ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Salvar limites
                      </Button>
                    </div>

                    <div className="space-y-3 rounded-md border border-border/70 p-3">
                      <p className="text-sm font-semibold">Billing gerencial</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          type="number"
                          min={0}
                          placeholder="Assentos contratados"
                          value={billingForm.contractedSeats}
                          onChange={(event) => setBillingForm((prev) => ({ ...prev, contractedSeats: event.target.value }))}
                        />
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Preço por assento"
                          value={billingForm.unitPrice}
                          onChange={(event) => setBillingForm((prev) => ({ ...prev, unitPrice: event.target.value }))}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={billingForm.billingCycle}
                          onChange={(event) => setBillingForm((prev) => ({ ...prev, billingCycle: event.target.value }))}
                        >
                          <option value="monthly">Mensal</option>
                          <option value="yearly">Anual</option>
                          <option value="trial">Trial</option>
                          <option value="manual">Manual</option>
                        </select>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={billingForm.discountType}
                          onChange={(event) => setBillingForm((prev) => ({ ...prev, discountType: event.target.value }))}
                        >
                          <option value="none">Sem desconto</option>
                          <option value="percent">Percentual</option>
                          <option value="fixed_amount">Valor fixo</option>
                          <option value="custom">Customizado</option>
                        </select>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Valor do desconto"
                          value={billingForm.discountValue}
                          onChange={(event) => setBillingForm((prev) => ({ ...prev, discountValue: event.target.value }))}
                        />
                        <Input
                          type="date"
                          value={billingForm.discountExpiresAt}
                          onChange={(event) => setBillingForm((prev) => ({ ...prev, discountExpiresAt: event.target.value }))}
                        />
                      </div>
                      <Input
                        placeholder="Motivo do ajuste de billing"
                        value={billingForm.reason}
                        onChange={(event) => setBillingForm((prev) => ({ ...prev, reason: event.target.value }))}
                      />
                      <Button size="sm" onClick={() => void handleSaveBilling()} disabled={isSavingBilling}>
                        {isSavingBilling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Salvar billing
                      </Button>
                    </div>
                  </div>
                </section>

                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="rounded-lg border border-border/70">
                    <div className="border-b border-border px-4 py-3">
                      <h3 className="font-semibold">Cabeçalho executivo</h3>
                    </div>
                    <div className="grid gap-3 p-4 text-sm">
                      <div><span className="text-muted-foreground">CNPJ:</span> {companyDetail?.cnpj || "-"}</div>
                      <div><span className="text-muted-foreground">Telefone:</span> {companyDetail?.phone || "-"}</div>
                      <div><span className="text-muted-foreground">Início:</span> {fmtDate(companyBilling?.start_date || companyDetail?.created_at)}</div>
                      <div><span className="text-muted-foreground">Expiração:</span> {fmtDate(companyDetail?.expiration_date)}</div>
                      <div><span className="text-muted-foreground">Health score:</span> {companyDetail?.health?.score ?? "-"} ({companyDetail?.health?.label || "-"})</div>
                      <div><span className="text-muted-foreground">Próxima melhor ação:</span> {(companyDetail?.health?.next_actions || []).join(" · ") || "-"}</div>
                    </div>
                  </section>

                  <section className="rounded-lg border border-border/70">
                    <div className="border-b border-border px-4 py-3">
                      <h3 className="font-semibold">Uso do produto</h3>
                    </div>
                    <div className="grid gap-3 p-4 text-sm">
                      <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-muted-foreground" />Análises totais: <span className="font-mono">{companyDetail?.analytics?.analyses_total ?? 0}</span></div>
                      <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-muted-foreground" />Últimos 7 dias: <span className="font-mono">{companyDetail?.analytics?.analyses_7d ?? 0}</span></div>
                      <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-muted-foreground" />Últimos 30 dias: <span className="font-mono">{companyDetail?.analytics?.analyses_30d ?? 0}</span></div>
                      <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />Usuários com uso: <span className="font-mono">{companyDetail?.analytics?.users_with_analyses ?? 0}</span></div>
                      <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground" />Score médio: <span className="font-mono">{Number(companyDetail?.analytics?.avg_score_geral || 0).toFixed(1)}</span></div>
                      <div className="flex items-center gap-2"><CircleDollarSign className="h-4 w-4 text-muted-foreground" />Última análise: <span>{fmtDateTime(companyDetail?.analytics?.last_analysis_at)}</span></div>
                    </div>
                  </section>
                </div>

                <section className="rounded-lg border border-border/70">
                  <div className="border-b border-border px-4 py-3">
                    <h3 className="font-semibold">Financeiro / Billing</h3>
                  </div>
                  <div className="grid gap-3 p-4 text-sm md:grid-cols-2">
                    <div><span className="text-muted-foreground">Plano contratado:</span> {companyBilling?.plan_name || companyDetail?.plan_name || "-"}</div>
                    <div><span className="text-muted-foreground">Valor por usuário:</span> {formatCurrency(Number(companyBilling?.unit_price || 0))}</div>
                    <div><span className="text-muted-foreground">Assentos contratados:</span> {companyBilling?.contracted_seats ?? companyDetail?.max_active_users ?? 0}</div>
                    <div><span className="text-muted-foreground">Usuários ativos:</span> {companyDetail?.active_users_count ?? 0}</div>
                    <div><span className="text-muted-foreground">Desconto:</span> {Number(companyBilling?.discount_value || 0) > 0 ? `${companyBilling?.discount_type} (${companyBilling?.discount_value})` : "Sem desconto"}</div>
                    <div><span className="text-muted-foreground">Expiração do desconto:</span> {fmtDate(companyBilling?.discount_expires_at)}</div>
                    <div><span className="text-muted-foreground">MRR líquido:</span> {formatCurrency(Number(companyBilling?.expected_mrr || 0))}</div>
                    <div><span className="text-muted-foreground">ARR líquido:</span> {formatCurrency(Number(companyBilling?.expected_arr || 0))}</div>
                    <div><span className="text-muted-foreground">Última cobrança:</span> {fmtDate(companyBilling?.last_billing_date)}</div>
                    <div><span className="text-muted-foreground">Próxima cobrança:</span> {fmtDate(companyBilling?.next_billing_date)}</div>
                    <div><span className="text-muted-foreground">Stripe customer:</span> {companyBilling?.stripe_customer_id || "-"}</div>
                    <div><span className="text-muted-foreground">Stripe subscription:</span> {companyBilling?.stripe_subscription_id || "-"}</div>
                  </div>
                </section>

                <section className="rounded-lg border border-border/70">
                  <div className="border-b border-border px-4 py-3">
                    <h3 className="font-semibold">Usuários</h3>
                  </div>
                  {companyDetail?.users?.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px] text-sm">
                        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 font-medium">Nome</th>
                            <th className="px-4 py-3 font-medium">Contato</th>
                            <th className="px-4 py-3 font-medium">Status / Papel</th>
                            <th className="px-4 py-3 font-medium">Calendário</th>
                            <th className="px-4 py-3 font-medium">Último uso</th>
                            <th className="px-4 py-3 text-right font-medium">Análises</th>
                            <th className="px-4 py-3 font-medium">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {companyDetail.users.map((user) => (
                            <tr key={user.id} className="border-t border-border/70">
                              <td className="px-4 py-3 font-medium">{user.name || "-"}</td>
                              <td className="px-4 py-3 text-muted-foreground">{user.email || "-"}<br />{user.phone || ""}</td>
                              <td className="px-4 py-3">{user.status || "-"} · {user.role || user.seller_type || "-"}</td>
                              <td className="px-4 py-3">{calendarLabel(user.calendar_connected, user.microsoft_calendar_connected)}</td>
                              <td className="px-4 py-3">{fmtDateTime(user.last_analysis_at)}</td>
                              <td className="px-4 py-3 text-right font-mono">{user.analyses_count ?? 0}</td>
                              <td className="px-4 py-3">
                                <Button size="sm" variant="outline" onClick={() => setSelectedCompanyUser(user)}>
                                  Ver detalhes
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">Nenhum usuário vinculado encontrado.</div>
                  )}
                </section>

                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="rounded-lg border border-border/70">
                    <div className="border-b border-border px-4 py-3">
                      <h3 className="font-semibold">Riscos e alertas</h3>
                    </div>
                    <div className="space-y-2 p-4 text-sm">
                      {companyAlerts.length > 0 ? companyAlerts.map((alert) => (
                        <div key={`${alert.alert_code}-${alert.company_id}`} className="rounded-md border border-border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{alert.message}</p>
                            <Badge variant={alert.severity === "high" ? "destructive" : "outline"}>{alert.severity}</Badge>
                          </div>
                        </div>
                      )) : <p className="text-muted-foreground">Sem alertas ativos para essa empresa.</p>}
                    </div>
                  </section>

                  <section className="rounded-lg border border-border/70">
                    <div className="border-b border-border px-4 py-3">
                      <h3 className="font-semibold">Histórico e eventos</h3>
                    </div>
                    <div className="space-y-2 p-4 text-sm">
                      {[...companyBillingEvents.slice(0, 5), ...companyAuditLog.slice(0, 5)].length ? (
                        [...companyBillingEvents.slice(0, 5), ...companyAuditLog.slice(0, 5)]
                          .sort((a, b) => new Date((b as BillingEvent).event_date || (b as AuditLogItem).created_at || 0).getTime() - new Date((a as BillingEvent).event_date || (a as AuditLogItem).created_at || 0).getTime())
                          .map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="rounded-md border border-border p-3">
                              <p className="font-medium">{"event_type" in item ? item.event_type : item.action}</p>
                              <p className="text-xs text-muted-foreground">{fmtDateTime("event_date" in item ? item.event_date : item.created_at)} · {("created_by" in item ? item.created_by : item.actor_email) || "sistema"}</p>
                              {("description" in item && item.description) ? <p className="mt-1 text-xs text-muted-foreground">{item.description}</p> : null}
                            </div>
                          ))
                      ) : (
                        <p className="text-muted-foreground">Sem eventos no histórico.</p>
                      )}
                    </div>
                  </section>
                </div>

                <section className="rounded-lg border border-border/70">
                  <div className="border-b border-border px-4 py-3">
                    <h3 className="font-semibold">Eventos Stripe</h3>
                  </div>
                  <div className="grid gap-3 p-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-medium">Webhook events</p>
                      <div className="space-y-2 text-xs">
                        {companyStripeEvents.slice(0, 8).map((event) => (
                          <div key={event.id} className="rounded border border-border p-2">
                            <p className="font-medium">{event.event_type}</p>
                            <p className="text-muted-foreground">{event.processing_status} · {fmtDateTime(event.created_at)}</p>
                          </div>
                        ))}
                        {!companyStripeEvents.length && <p className="text-muted-foreground">Sem eventos Stripe vinculados.</p>}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium">Compras Stripe</p>
                      <div className="space-y-2 text-xs">
                        {companyStripePurchases.slice(0, 8).map((purchase) => (
                          <div key={purchase.id} className="rounded border border-border p-2">
                            <p className="font-medium">{purchase.plan_name || "Plano"} · {formatCurrency(Number(purchase.amount_total || 0))}</p>
                            <p className="text-muted-foreground">{purchase.account_creation_status} · {fmtDateTime(purchase.created_at)}</p>
                          </div>
                        ))}
                        {!companyStripePurchases.length && <p className="text-muted-foreground">Sem compras Stripe vinculadas.</p>}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedCompanyUser} onOpenChange={(open) => !open && setSelectedCompanyUser(null)}>
        <DialogContent className="sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>{selectedCompanyUser?.name || "Usuário"}</DialogTitle>
          </DialogHeader>
          {selectedCompanyUser ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <MetricTile label="Status" value={selectedCompanyUser.status || "-"} hint="Conta do usuário" />
                <MetricTile label="Análises 7d" value={String(selectedCompanyUser.analyses_7d ?? 0)} hint="Uso recente" />
                <MetricTile label="Análises 30d" value={String(selectedCompanyUser.analyses_30d ?? 0)} hint="Uso mensal" />
                <MetricTile label="Último uso" value={fmtDate(selectedCompanyUser.last_analysis_at)} hint="Última análise registrada" />
              </div>

              <div className="grid gap-3 rounded-md border border-border p-4 text-sm md:grid-cols-2">
                <div><span className="text-muted-foreground">E-mail:</span> {selectedCompanyUser.email || "-"}</div>
                <div><span className="text-muted-foreground">Telefone:</span> {selectedCompanyUser.phone || "-"}</div>
                <div><span className="text-muted-foreground">Papel:</span> {selectedCompanyUser.role || selectedCompanyUser.seller_type || "-"}</div>
                <div><span className="text-muted-foreground">Calendário:</span> {calendarLabel(selectedCompanyUser.calendar_connected, selectedCompanyUser.microsoft_calendar_connected)}</div>
                <div><span className="text-muted-foreground">Vinculado em:</span> {fmtDate(selectedCompanyUser.linked_at)}</div>
                <div><span className="text-muted-foreground">Onboarding:</span> {selectedCompanyUser.onboarding_completed_at ? "Concluído" : "Pendente"}</div>
              </div>

              <div className="grid gap-3 rounded-md border border-border p-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Status de acesso</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={userActionLinkId === selectedCompanyUser.link_id} onClick={() => void handleUserStatus(selectedCompanyUser, "ACTIVE")}>Ativar</Button>
                    <Button size="sm" variant="outline" disabled={userActionLinkId === selectedCompanyUser.link_id} onClick={() => void handleUserStatus(selectedCompanyUser, "INACTIVE")}>Inativar</Button>
                    <Button size="sm" variant="outline" disabled={userActionLinkId === selectedCompanyUser.link_id} onClick={() => void handleUserStatus(selectedCompanyUser, "SUSPENDED")}>Suspender</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Onboarding</p>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={userActionLinkId === selectedCompanyUser.link_id}
                    onClick={() => void handleUserOnboarding(selectedCompanyUser, !selectedCompanyUser.onboarding_completed_at)}
                  >
                    {selectedCompanyUser.onboarding_completed_at ? "Reabrir onboarding" : "Concluir onboarding"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Papel/função</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={userActionLinkId === selectedCompanyUser.link_id} onClick={() => void handleUserRole(selectedCompanyUser, "ADMIN")}>ADMIN</Button>
                    <Button size="sm" variant="outline" disabled={userActionLinkId === selectedCompanyUser.link_id} onClick={() => void handleUserRole(selectedCompanyUser, "MEMBER")}>MEMBER</Button>
                    <Button size="sm" variant="outline" disabled={userActionLinkId === selectedCompanyUser.link_id} onClick={() => void handleUserRole(selectedCompanyUser, "SELLER")}>SELLER</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Ação crítica</p>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={userActionLinkId === selectedCompanyUser.link_id}
                    onClick={() => void handleRemoveUserLink(selectedCompanyUser)}
                  >
                    Remover vínculo deste cliente
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
