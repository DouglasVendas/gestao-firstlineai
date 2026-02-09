import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Invoice } from "@/hooks/useInvoices";

const statusConfig: Record<string, { label: string; className: string }> = {
  paid: { label: "Pago", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pendente", className: "bg-warning/10 text-warning border-warning/20" },
  overdue: { label: "Atrasado", className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
};

interface InvoiceDetailsModalProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDetailsModal({ invoice, open, onOpenChange }: InvoiceDetailsModalProps) {
  if (!invoice) return null;

  const status = statusConfig[invoice.status] || statusConfig["pending"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes da Fatura</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ID</p>
              <p className="font-mono text-sm">#{invoice.id.slice(0, 8)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={status.className}>{status.label}</Badge>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Cliente</p>
            <p className="font-medium">{invoice.client?.name || "Cliente Desconhecido"}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="font-mono font-medium">{formatCurrency(invoice.value)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vencimento</p>
              <p className="font-mono">{formatDate(invoice.due_date)}</p>
            </div>
          </div>

          {invoice.paid_date && (
            <div>
              <p className="text-sm text-muted-foreground">Data de Pagamento</p>
              <p className="font-mono">{formatDate(invoice.paid_date)}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">Criado em</p>
            <p className="font-mono">{formatDate(invoice.created_at)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
