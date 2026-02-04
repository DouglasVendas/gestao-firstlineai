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
import { MoreHorizontal, Send, CreditCard, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface Invoice {
  id: string;
  client: string;
  plan: string;
  value: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue" | "cancelled";
  paidDate?: string;
}

const invoices: Invoice[] = [
  { id: "FAT-001", client: "Tech Solutions Ltda", plan: "Enterprise", value: 4500, dueDate: "2024-01-15", status: "paid", paidDate: "2024-01-14" },
  { id: "FAT-002", client: "Startup XYZ", plan: "Pro", value: 890, dueDate: "2024-01-20", status: "paid", paidDate: "2024-01-20" },
  { id: "FAT-003", client: "Digital Corp", plan: "Enterprise", value: 4500, dueDate: "2024-01-25", status: "pending" },
  { id: "FAT-004", client: "Cloud Services SA", plan: "Pro", value: 890, dueDate: "2024-01-10", status: "overdue" },
  { id: "FAT-005", client: "Innovation Hub", plan: "Básico", value: 299, dueDate: "2024-01-05", status: "overdue" },
  { id: "FAT-006", client: "Data Analytics Co", plan: "Pro", value: 890, dueDate: "2024-01-28", status: "pending" },
  { id: "FAT-007", client: "Fintech Brasil", plan: "Enterprise", value: 4500, dueDate: "2024-01-18", status: "paid", paidDate: "2024-01-17" },
  { id: "FAT-008", client: "E-commerce Plus", plan: "Pro", value: 890, dueDate: "2024-01-12", status: "cancelled" },
];

const statusConfig = {
  paid: { label: "Pago", variant: "default" as const, className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pendente", variant: "secondary" as const, className: "bg-warning/10 text-warning border-warning/20" },
  overdue: { label: "Atrasado", variant: "destructive" as const, className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Cancelado", variant: "outline" as const, className: "bg-muted text-muted-foreground" },
};

export function InvoicesTable() {
  return (
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
          {invoices.map((invoice) => {
            const status = statusConfig[invoice.status];
            return (
              <TableRow key={invoice.id}>
                <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                <TableCell className="font-medium">{invoice.client}</TableCell>
                <TableCell>{invoice.plan}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(invoice.value)}
                </TableCell>
                <TableCell>{formatDate(invoice.dueDate)}</TableCell>
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
