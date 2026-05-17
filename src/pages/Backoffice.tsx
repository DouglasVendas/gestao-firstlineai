import { useEffect, useMemo, useState } from "react";
import { Activity, Building2, CreditCard, Database, Loader2, Lock, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { backofficeApi, type AlertSummary, type AuditLogItem, type BackofficeAlert, type BillingCompany, type BillingSummary, type Company, type CompanyUserLink, type InternalUser, type Plan, type UsersSummary } from "@/lib/backofficeApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";

const defaultEmail = "douglasvslopes@gmail.com";
const pageSize = 50;
type Section = "companies" | "users" | "plans" | "finance" | "monitoring";

function fmtDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(date);
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

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{message}</div>;
}

export default function Backoffice() {
  const { setPageTitle } = usePageTitle();
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
  const [usersLinks, setUsersLinks] = useState<CompanyUserLink[]>([]);
  const [usersSummary, setUsersSummary] = useState<UsersSummary | null>(null);
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

  async function loadData(activeSection = section) {
    setIsLoadingData(true);
    setBackendMessage("");
    try {
      const healthResponse = await backofficeApi.health();
      setHealth({ database: healthResponse.database, tables: healthResponse.tables });

      if (activeSection === "companies") {
        const response = await backofficeApi.companies(1, pageSize);
        setCompanies(response.items || []);
        setBackendMessage(response.message || "");
      }
      if (activeSection === "users") {
        const response = await backofficeApi.users(1, pageSize);
        setUsersLinks(response.items || []);
        setUsersSummary(response.summary || null);
        setBackendMessage(response.message || "");
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

  const filteredCompanies = useMemo(() => {
    const term = companySearch.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((company) => [company.name, company.cnpj, company.contact_email, company.plan_name].join(" ").toLowerCase().includes(term));
  }, [companies, companySearch]);

  const activeCompanies = filteredCompanies.filter((company) => (company.account_status || "").toLowerCase() === "active").length;

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
        <TabsList className="grid w-full grid-cols-5 lg:w-[900px]">
          <TabsTrigger value="companies"><Building2 className="mr-2 h-4 w-4" />Clientes</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Usuários</TabsTrigger>
          <TabsTrigger value="plans"><ShieldCheck className="mr-2 h-4 w-4" />Planos</TabsTrigger>
          <TabsTrigger value="finance"><CreditCard className="mr-2 h-4 w-4" />Financeiro</TabsTrigger>
          <TabsTrigger value="monitoring"><Activity className="mr-2 h-4 w-4" />Monitoramento</TabsTrigger>
        </TabsList>

        {backendMessage && <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-muted-foreground">{backendMessage}</div>}
        {isLoadingData && <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando backoffice...</div>}

        <TabsContent value="companies" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Clientes listados</p><p className="mt-2 font-mono text-3xl font-semibold">{filteredCompanies.length}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Clientes ativos</p><p className="mt-2 font-mono text-3xl font-semibold text-success">{activeCompanies}</p></CardContent></Card>
          </div>
          <Input placeholder="Buscar por empresa, CNPJ, e-mail ou plano" value={companySearch} onChange={(event) => setCompanySearch(event.target.value)} />
          <Card><CardContent className="p-0">{filteredCompanies.length ? <Table><TableHeader><TableRow><TableHead>Empresa</TableHead><TableHead>Plano</TableHead><TableHead>Usuários</TableHead><TableHead>Cadastro</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{filteredCompanies.map((company) => <TableRow key={company.id}><TableCell className="font-medium">{company.name || "-"}<p className="text-xs text-muted-foreground">{company.contact_email || "-"}</p></TableCell><TableCell>{company.plan_name || "Sem plano"}</TableCell><TableCell>{company.active_users_count ?? 0} ativos / {company.users_count ?? 0} totais</TableCell><TableCell>{fmtDate(company.created_at)}</TableCell><TableCell><Badge variant="outline">{company.account_status || "-"}</Badge></TableCell></TableRow>)}</TableBody></Table> : <EmptyState message="Nenhuma empresa retornada ainda. O backend está conectado; falta mapear o schema de empresas do FirstLine para o banco atual." />}</CardContent></Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2"><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Usuários únicos</p><p className="mt-2 font-mono text-3xl font-semibold">{usersSummary?.users_total ?? 0}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Vínculos ativos</p><p className="mt-2 font-mono text-3xl font-semibold">{usersSummary?.links_active_users ?? 0}</p></CardContent></Card></div>
          <Card><CardContent className="p-0">{usersLinks.length ? <Table><TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Empresa</TableHead><TableHead>Função</TableHead><TableHead>Status</TableHead><TableHead>Calendário</TableHead></TableRow></TableHeader><TableBody>{usersLinks.map((link) => <TableRow key={link.link_id}><TableCell>{link.user_name || "-"}<p className="text-xs text-muted-foreground">{link.user_email}</p></TableCell><TableCell>{link.company_name || "-"}</TableCell><TableCell>{link.seller_type || link.role || "-"}</TableCell><TableCell><Badge variant="outline">{link.user_status || "-"}</Badge></TableCell><TableCell>{calendarLabel(link.calendar_connected, link.microsoft_calendar_connected)}</TableCell></TableRow>)}</TableBody></Table> : <EmptyState message="Nenhum usuário de empresa retornado ainda." />}</CardContent></Card>
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

      <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground"><Database className="mr-2 inline h-4 w-4" />Backend conectado. Esta é a primeira camada do backoffice; os dados operacionais entram quando mapearmos o schema FirstLine completo.</div>
    </div>
  );
}
