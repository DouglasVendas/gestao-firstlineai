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
import { useInvoices } from "@/hooks/useInvoices";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  paid: { label: "Pago", variant: "default", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pendente", variant: "secondary", className: "bg-warning/10 text-warning border-warning/20" },
  overdue: { label: "Atrasado", variant: "destructive", className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Cancelado", variant: "outline", className: "bg-muted text-muted-foreground" },
};

export function InvoicesTable() {
  const { data: invoices, isLoading } = useInvoices();

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-border">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {/* Using invoice ID or specific number if available, else standard ID */}
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
                <TableCell>{"-"}</TableCell> {/* Plan info not directly in invoices join currently */}
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
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar cobrança
                      </DropdownMenuItem>
                      <DropdownMenuItem>
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
  );
}
