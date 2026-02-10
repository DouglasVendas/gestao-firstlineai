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
import { MoreHorizontal, Send, CreditCard, Eye, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useInvoices, type Invoice } from "@/hooks/useInvoices";
import { InvoiceDetailsModal } from "@/components/modals/InvoiceDetailsModal";
import { RegisterPaymentModal } from "@/components/modals/RegisterPaymentModal";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  paid: { label: "Pago", variant: "default", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pendente", variant: "secondary", className: "bg-warning/10 text-warning border-warning/20" },
  overdue: { label: "Atrasado", variant: "destructive", className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Cancelado", variant: "outline", className: "bg-muted text-muted-foreground" },
};

interface InvoicesTableProps {
  data?: Invoice[];
}

export function InvoicesTable({ data }: InvoicesTableProps) {
  // If data is provided via props, use it. Otherwise fetch (legacy behavior or if used elsewhere without filters)
  // But we want to rely on parent data if provided.
  const { data: fetchedInvoices, isLoading } = useInvoices();

  const invoices = data || fetchedInvoices;

  const { toast } = useToast();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // If we are waiting for data
  if (isLoading && !data) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-border">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If no data found
  if (invoices && invoices.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-border text-muted-foreground">
        Nenhuma fatura encontrada.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Fatura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices?.map((invoice) => {
              const status = statusConfig[invoice.status] || statusConfig["pending"];
              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">#{invoice.id.slice(0, 8)}</TableCell>
                  <TableCell className="font-medium">{invoice.client?.name || "Cliente Desconhecido"}</TableCell>
                  <TableCell>{"-"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(invoice.value)}
                  </TableCell>
                  <TableCell>{formatDate(invoice.due_date)}</TableCell>
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
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            toast({
                              title: "Cobrança enviada",
                              description: `Cobrança enviada para ${invoice.client?.name || "cliente"}.`,
                            });
                          }}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Enviar cobrança
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setPaymentOpen(true);
                          }}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Registrar pagamento
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <InvoiceDetailsModal
        invoice={selectedInvoice}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
      <RegisterPaymentModal
        invoiceId={selectedInvoice?.id || null}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
      />
    </>
  );
}
