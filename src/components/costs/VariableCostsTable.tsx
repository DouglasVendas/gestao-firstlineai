import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { VariableCost } from "@/hooks/useVariableCosts";

interface VariableCostsTableProps {
  costs: VariableCost[];
}

export function VariableCostsTable({ costs }: VariableCostsTableProps) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Categoria</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {costs.length > 0 ? (
            costs.map((cost) => (
              <TableRow key={cost.id}>
                <TableCell>
                  <Badge variant="outline">{cost.category}</Badge>
                </TableCell>
                <TableCell>{cost.description || "-"}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(cost.amount)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(cost.month).toLocaleDateString('pt-BR')}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                Nenhum custo variável neste mês.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
