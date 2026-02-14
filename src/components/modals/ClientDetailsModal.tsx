import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Client } from "@/hooks/useClients";
import { Invoice } from "@/hooks/useInvoices";

interface ClientDetailsModalProps {
    client: Client | null;
    invoices: Invoice[] | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ClientDetailsModal({
    client,
    invoices,
    open,
    onOpenChange,
}: ClientDetailsModalProps) {
    if (!client) return null;

    // --- Financial Logic ---
    const clientInvoices = invoices?.filter(inv => inv.client_id === client.id && inv.status === 'paid') || [];
    const paymentCount = clientInvoices.length;
    const ltv = clientInvoices.reduce((sum, inv) => sum + Number(inv.value), 0);

    const startDate = client.start_date ? new Date(client.start_date) : new Date(client.created_at);
    const endDate = client.churn_date ? new Date(client.churn_date) : new Date();

    // Lifetime
    const yearsDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthsDiff = endDate.getMonth() - startDate.getMonth();
    const totalMonths = (yearsDiff * 12) + monthsDiff;
    const lifetimeStr = totalMonths < 1 ? "Novo" : `${totalMonths} meses`;

    // Contract Projection
    const contractDuration = client.contract_duration || 12;
    const contractEndDate = new Date(startDate);
    contractEndDate.setMonth(contractEndDate.getMonth() + contractDuration);

    const today = new Date();
    const remainingTime = contractEndDate.getTime() - today.getTime();
    const isExpired = remainingTime < 0;
    const remainingMonths = isExpired ? 0 : Math.ceil(remainingTime / (1000 * 60 * 60 * 24 * 30));
    const projectedRevenue = remainingMonths * client.mrr;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Resumo Financeiro: {client.name}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">

                    {/* Section 1: Contrato & Prazos */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Início do Contrato</span>
                            <p className="font-mono text-base">{formatDate(startDate.toISOString())}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Fim do Contrato</span>
                            <p className={`font-mono text-base ${isExpired ? "text-destructive" : ""}`}>
                                {formatDate(contractEndDate.toISOString())}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Duração Total</span>
                            <p className="text-base">{contractDuration} meses</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Tempo de Casa (Lifetime)</span>
                            <p className="text-base">{lifetimeStr}</p>
                        </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Section 2: Métricas Financeiras */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium text-muted-foreground block mb-1">Lifetime Value (LTV)</span>
                            <p className="text-2xl font-mono font-bold text-primary">{formatCurrency(ltv)}</p>
                            <p className="text-xs text-muted-foreground mt-1">{paymentCount} pagamentos realizados</p>
                        </div>

                        <div className="p-4 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium text-muted-foreground block mb-1">Receita Projetada (Restante)</span>
                            <p className="text-2xl font-mono font-bold text-success">{formatCurrency(projectedRevenue)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Baseado em {remainingMonths} meses restantes</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">MRR Atual</span>
                            <p className="font-mono text-lg">{formatCurrency(client.mrr)}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Status</span>
                            <p className="capitalize">{client.calculatedStatus || client.status}</p>
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
