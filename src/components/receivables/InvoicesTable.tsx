import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Send, CreditCard, Eye, Loader2, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useInvoices } from "@/hooks/useInvoices";
import { InvoiceDetailsModal } from "@/components/modals/InvoiceDetailsModal";
import { RegisterPaymentModal } from "@/components/modals/RegisterPaymentModal";
import { useToast } from "@/hooks/use-toast";
import type { DisplayInvoice } from "@/utils/computeInvoices";
import type { Invoice } from "@/hooks/useInvoices";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  paid: { label: "Pago", variant: "default", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pendente", variant: "secondary", className: "bg-warning/10 text-warning border-warning/20" },
  overdue: { label: "Atrasado", variant: "destructive", className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Cancelado", variant: "outline", className: "bg-muted text-muted-foreground" },
};

interface InvoicesTableProps {
  data?: DisplayInvoice[];
}

export function InvoicesTable({ data }: InvoicesTableProps) {
  const { data: fetchedInvoices, isLoading } = useInvoices();
  const { toast } = useToast();

  const invoices: DisplayInvoice[] = data || (fetchedInvoices?.map(inv => ({ ...inv, is_computed: false as const })) ?? []);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [paymentComputed, setPaymentComputed] = useState<{
    client_id: string;
    value: number;
    due_date: string;
  } | null>(null);

  const openPayment = (inv: DisplayInvoice) => {
    if (inv.is_computed) {
      setPaymentInvoiceId(null);
      setPaymentComputed({
        client_id: inv.client_id,
        value: inv.value,
        due_date: inv.due_date,
      });
    } else {
      setPaymentInvoiceId(inv.id);
      setPaymentComputed(null);
    }
    setPaymentOpen(true);
  };

  if (isLoading && !data) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-border">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-border text-muted-foreground">
        Nenhuma fatura encontrada.
      </div>
    );
  }

  return (
    <>
      <TooltipProvider>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Cliente</TableHead>
                <TableHead>Plano / Ciclo</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const status = statusConfig[invoice.status] || statusConfig["pending"];
                const isPaid = invoice.status === 'paid';

                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {invoice.client?.name || "Cliente Desconhecido"}
                        {invoice.is_computed && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Fatura gerada automaticamente — aguarda confirmação de pagamento</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {'plan_name' in invoice && invoice.plan_name
                        ? invoice.plan_name
                        : '-'}
                    </TableCell>
                    <TableCell>{formatDate(invoice.due_date)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.value)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!invoice.is_computed && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedInvoice(invoice as Invoice);
                                setDetailsOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              toast({
                                title: "Cobrança enviada",
                                description: `Cobrança enviada para ${invoice.client?.name || "cliente"}.`,
                              })
                            }
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Enviar cobrança
                          </DropdownMenuItem>
                          {!isPaid && (
                            <DropdownMenuItem onClick={() => openPayment(invoice)}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Registrar pagamento
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>

      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}

      <RegisterPaymentModal
        invoiceId={paymentInvoiceId}
        computedInvoice={paymentComputed}
        open={paymentOpen}
        onOpenChange={(open) => {
          setPaymentOpen(open);
          if (!open) {
            setPaymentInvoiceId(null);
            setPaymentComputed(null);
          }
        }}
      />
    </>
  );
}
