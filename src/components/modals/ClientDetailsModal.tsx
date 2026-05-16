import {
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    Clock,
    Mail,
    Receipt,
    TrendingUp,
    Wallet,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { formatClientName } from "@/lib/clientNames";
import { calculateClientProjectedRevenue, getProjectedRevenueMonths } from "@/lib/clientRevenue";
import { Client, getEffectiveMRR } from "@/hooks/useClients";
import { Invoice } from "@/hooks/useInvoices";
import { ClientStatusBadge } from "@/components/clients/ClientStatusBadge";

interface ClientDetailsModalProps {
    client: Client | null;
    invoices: Invoice[] | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const billingCycleLabels: Record<string, string> = {
    monthly: "Mensal",
    bimonthly: "Bimestral",
    quarterly: "Trimestral",
    semiannual: "Semestral",
    yearly: "Anual",
};

const invoiceStatusLabels: Record<string, string> = {
    paid: "Paga",
    pending: "Aberta",
    overdue: "Atrasada",
    canceled: "Cancelada",
};

function diffInMonths(start: Date, end: Date) {
    return Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth());
}

function getInvoiceState(invoice: Invoice, today: Date) {
    if (invoice.status === "paid") return "paid";
    if (invoice.status === "canceled") return "canceled";

    const dueDate = new Date(invoice.due_date);
    if (invoice.status === "overdue" || dueDate < today) return "overdue";

    return "pending";
}

function invoiceBadgeClass(status: string) {
    if (status === "paid") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "overdue") return "bg-red-50 text-red-700 border-red-200";
    if (status === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-muted text-muted-foreground border-border";
}

function MetricTile({
    label,
    value,
    hint,
    tone = "default",
}: {
    label: string;
    value: string;
    hint: string;
    tone?: "default" | "success" | "danger" | "warning";
}) {
    return (
        <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={cn(
                "mt-2 font-mono text-2xl font-semibold",
                tone === "success" && "text-success",
                tone === "danger" && "text-destructive",
                tone === "warning" && "text-amber-600"
            )}>
                {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
    );
}

export function ClientDetailsModal({
    client,
    invoices,
    open,
    onOpenChange,
}: ClientDetailsModalProps) {
    if (!client) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clientInvoices = (invoices || [])
        .filter((invoice) => invoice.client_id === client.id)
        .map((invoice) => ({
            ...invoice,
            computedStatus: getInvoiceState(invoice, today),
        }))
        .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());

    const paidInvoices = clientInvoices.filter((invoice) => invoice.computedStatus === "paid");
    const overdueInvoices = clientInvoices.filter((invoice) => invoice.computedStatus === "overdue");
    const pendingInvoices = clientInvoices.filter((invoice) => invoice.computedStatus === "pending");
    const collectibleInvoices = clientInvoices.filter((invoice) => invoice.computedStatus !== "canceled");

    const ltv = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.value || 0), 0);
    const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + Number(invoice.value || 0), 0);
    const openAmount = [...overdueInvoices, ...pendingInvoices].reduce((sum, invoice) => sum + Number(invoice.value || 0), 0);
    const paidAmount = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.value || 0), 0);
    const totalCollectible = collectibleInvoices.reduce((sum, invoice) => sum + Number(invoice.value || 0), 0);
    const collectionRate = totalCollectible > 0 ? Math.round((paidAmount / totalCollectible) * 100) : 0;

    const startDate = client.start_date ? new Date(client.start_date) : new Date(client.created_at);
    const endDate = client.churn_date ? new Date(client.churn_date) : today;
    const lifetimeMonths = diffInMonths(startDate, endDate);
    const lifetimeLabel = lifetimeMonths < 1 ? "Novo cliente" : `${lifetimeMonths} meses`;
    const effectiveMrr = getEffectiveMRR(client);
    const projectedRevenueMonths = getProjectedRevenueMonths(client, today);
    const projectedRevenue = calculateClientProjectedRevenue(client, today);

    const contractDuration = client.contract_duration || 12;
    const contractEndDate = new Date(startDate);
    contractEndDate.setMonth(contractEndDate.getMonth() + contractDuration);
    const isRecurring = !client.billing_cycle || client.billing_cycle === "monthly";
    const isChurned = client.status === "churned";
    const monthsToRenew = diffInMonths(today, contractEndDate);
    const isContractExpired = !isRecurring && contractEndDate < today && !isChurned;

    const nextDueInvoice = [...pendingInvoices, ...overdueInvoices]
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
    const lastPaidInvoice = paidInvoices
        .filter((invoice) => invoice.paid_date)
        .sort((a, b) => new Date(b.paid_date || "").getTime() - new Date(a.paid_date || "").getTime())[0];

    const riskLevel = isChurned
        ? "Cancelado"
        : overdueInvoices.length > 0 || isContractExpired
            ? "Atenção"
            : pendingInvoices.length > 0
                ? "Monitorar"
                : "Saudável";

    const riskTone = riskLevel === "Saudável" ? "success" : riskLevel === "Monitorar" ? "warning" : "danger";

    const subscriptionLabels = client.subscriptions?.map((subscription) => (
        `${subscription.product?.name || "Produto"} / ${subscription.plan?.name || "Plano"}`
    )) || [];
    const productLabels = client.subscriptions?.length
        ? client.subscriptions.map((subscription) => subscription.product?.name).filter(Boolean)
        : client.products || [];

    const recentInvoices = clientInvoices.slice(0, 8);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-[980px]">
                <DialogHeader className="border-b border-border px-6 py-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-semibold">{formatClientName(client.name)}</DialogTitle>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <ClientStatusBadge status={client.calculatedStatus || client.status} />
                                <span>{client.plan?.name || subscriptionLabels.join(" + ") || "Sem plano definido"}</span>
                                {client.billing_cycle && <span>{billingCycleLabels[client.billing_cycle] || client.billing_cycle}</span>}
                            </div>
                        </div>
                        <Badge className={cn(
                            "w-fit border px-3 py-1 text-sm",
                            riskTone === "success" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                            riskTone === "warning" && "bg-amber-50 text-amber-700 border-amber-200",
                            riskTone === "danger" && "bg-red-50 text-red-700 border-red-200"
                        )}>
                            {riskLevel}
                        </Badge>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-96px)]">
                    <div className="space-y-6 p-6">
                        <div className="grid gap-3 md:grid-cols-4">
                            <MetricTile
                                label="MRR"
                                value={formatCurrency(effectiveMrr)}
                                hint="Receita mensal normalizada"
                                tone="success"
                            />
                            <MetricTile
                                label="LTV recebido"
                                value={formatCurrency(ltv)}
                                hint={`${paidInvoices.length} faturas pagas`}
                            />
                            <MetricTile
                                label="Em aberto"
                                value={formatCurrency(openAmount)}
                                hint={`${pendingInvoices.length + overdueInvoices.length} faturas a receber`}
                                tone={openAmount > 0 ? "warning" : "default"}
                            />
                            <MetricTile
                                label="Atrasado"
                                value={formatCurrency(overdueAmount)}
                                hint={`${overdueInvoices.length} faturas vencidas`}
                                tone={overdueAmount > 0 ? "danger" : "default"}
                            />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                            <section className="rounded-lg border border-border/70">
                                <div className="border-b border-border px-4 py-3">
                                    <h3 className="font-semibold">Dados e contrato</h3>
                                </div>
                                <div className="grid gap-4 p-4 sm:grid-cols-2">
                                    <div className="flex gap-3">
                                        <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Contato</p>
                                            <p className="text-sm font-medium">{client.email || "Email não informado"}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Wallet className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Produtos</p>
                                            <p className="text-sm font-medium">{productLabels.length ? productLabels.join(", ") : "Sem produto definido"}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <CalendarClock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Inicio e tempo de casa</p>
                                            <p className="text-sm font-medium">{formatDate(startDate)} · {lifetimeLabel}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Renovacao / termino</p>
                                            <p className={cn("text-sm font-medium", isContractExpired && "text-destructive")}>
                                                {isChurned && client.churn_date
                                                    ? `Cancelado em ${formatDate(client.churn_date)}`
                                                    : isRecurring
                                                        ? "Contrato recorrente mensal"
                                                        : `${formatDate(contractEndDate)} · ${isContractExpired ? "vencido" : `${monthsToRenew} meses`}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-lg border border-border/70">
                                <div className="border-b border-border px-4 py-3">
                                    <h3 className="font-semibold">Leitura executiva</h3>
                                </div>
                                <div className="space-y-4 p-4">
                                    <div className="flex items-start gap-3">
                                        {riskTone === "success" ? (
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                                        ) : (
                                            <AlertTriangle className={cn("mt-0.5 h-4 w-4", riskTone === "warning" ? "text-amber-600" : "text-destructive")} />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium">Saude do cliente: {riskLevel}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {riskLevel === "Saudável" && "Sem pendencias financeiras relevantes no momento."}
                                                {riskLevel === "Monitorar" && "Existem faturas em aberto. Acompanhar vencimento para evitar atraso."}
                                                {riskLevel === "Atenção" && "Existe atraso financeiro ou contrato vencido. Prioridade para cobranca/renovacao."}
                                                {riskLevel === "Cancelado" && (client.churn_reason || "Cliente marcado como cancelado.")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-md bg-muted/30 p-3">
                                            <p className="text-xs text-muted-foreground">Taxa de recebimento</p>
                                            <p className="mt-1 font-mono text-lg font-semibold">{collectionRate}%</p>
                                        </div>
                                        <div className="rounded-md bg-muted/30 p-3">
                                            <p className="text-xs text-muted-foreground">Proxima fatura</p>
                                            <p className="mt-1 text-sm font-semibold">
                                                {nextDueInvoice ? `${formatCurrency(nextDueInvoice.value)} em ${formatDate(nextDueInvoice.due_date)}` : "Nada em aberto"}
                                            </p>
                                        </div>
                                        <div className="rounded-md bg-muted/30 p-3">
                                            <p className="text-xs text-muted-foreground">Ultimo pagamento</p>
                                            <p className="mt-1 text-sm font-semibold">
                                                {lastPaidInvoice?.paid_date ? `${formatCurrency(lastPaidInvoice.value)} em ${formatDate(lastPaidInvoice.paid_date)}` : "Sem pagamento registrado"}
                                            </p>
                                        </div>
                                        <div className="rounded-md bg-muted/30 p-3">
                                            <p className="text-xs text-muted-foreground">Receita projetada</p>
                                            <p className="mt-1 font-mono text-lg font-semibold">{formatCurrency(projectedRevenue)}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{projectedRevenueMonths} meses considerados</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <section className="rounded-lg border border-border/70">
                            <div className="flex flex-col gap-1 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="font-semibold">Faturas do cliente</h3>
                                <p className="text-sm text-muted-foreground">
                                    {paidInvoices.length} pagas · {pendingInvoices.length} abertas · {overdueInvoices.length} atrasadas
                                </p>
                            </div>
                            {recentInvoices.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[620px] text-sm">
                                        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Vencimento</th>
                                                <th className="px-4 py-3 font-medium">Pagamento</th>
                                                <th className="px-4 py-3 font-medium">Status</th>
                                                <th className="px-4 py-3 text-right font-medium">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentInvoices.map((invoice) => (
                                                <tr key={invoice.id} className="border-t border-border/70">
                                                    <td className="px-4 py-3">{formatDate(invoice.due_date)}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {invoice.paid_date ? formatDate(invoice.paid_date) : "-"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge className={cn("border", invoiceBadgeClass(invoice.computedStatus))}>
                                                            {invoiceStatusLabels[invoice.computedStatus]}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono font-medium">{formatCurrency(invoice.value)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
                                    <Receipt className="h-4 w-4" />
                                    Nenhuma fatura registrada para este cliente.
                                </div>
                            )}
                        </section>

                        <section className="rounded-lg border border-border/70 bg-muted/20 p-4">
                            <div className="flex items-start gap-3">
                                <TrendingUp className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div>
                                    <h3 className="font-semibold">O que esse painel deve responder</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Se o cliente esta gerando receita, se esta pagando em dia, quando precisa renovar,
                                        quanto ja gerou de caixa e qual acao comercial/financeira merece prioridade.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
