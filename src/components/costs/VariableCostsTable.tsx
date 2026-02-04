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
import { ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface CostItem {
  id: string;
  name: string;
  category: string;
  lastMonth: number;
  currentMonth: number;
  perClient: number;
  hasAnomaly?: boolean;
  clients?: { name: string; cost: number }[];
}

const costsData: CostItem[] = [
  {
    id: "1",
    name: "Anthropic Claude",
    category: "API IA",
    lastMonth: 12500,
    currentMonth: 14200,
    perClient: 142,
    hasAnomaly: true,
    clients: [
      { name: "Tech Solutions", cost: 3200 },
      { name: "Digital Corp", cost: 2800 },
      { name: "Fintech Brasil", cost: 2400 },
    ],
  },
  {
    id: "2",
    name: "OpenAI GPT-4",
    category: "API IA",
    lastMonth: 8200,
    currentMonth: 8800,
    perClient: 88,
    clients: [
      { name: "Innovation Hub", cost: 1800 },
      { name: "Data Analytics", cost: 1500 },
    ],
  },
  {
    id: "3",
    name: "AWS (variável)",
    category: "Cloud",
    lastMonth: 15800,
    currentMonth: 16200,
    perClient: 162,
  },
  {
    id: "4",
    name: "Google Cloud",
    category: "Cloud",
    lastMonth: 4200,
    currentMonth: 4500,
    perClient: 45,
  },
  {
    id: "5",
    name: "Stripe",
    category: "Gateway",
    lastMonth: 8900,
    currentMonth: 9200,
    perClient: 92,
  },
  {
    id: "6",
    name: "Asaas",
    category: "Gateway",
    lastMonth: 2100,
    currentMonth: 2300,
    perClient: 23,
  },
];

const categoryColors: Record<string, string> = {
  "API IA": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Cloud: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Gateway: "bg-green-500/10 text-green-400 border-green-500/20",
};

export function VariableCostsTable() {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10"></TableHead>
            <TableHead>Fornecedor/Serviço</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Mês Anterior</TableHead>
            <TableHead className="text-right">Mês Atual</TableHead>
            <TableHead className="text-right">Variação</TableHead>
            <TableHead className="text-right">Por Cliente</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {costsData.map((cost) => {
            const variation = ((cost.currentMonth - cost.lastMonth) / cost.lastMonth) * 100;
            const isExpanded = expandedRows.includes(cost.id);

            return (
              <>
                <TableRow key={cost.id} className={cn(cost.clients && "cursor-pointer")} onClick={() => cost.clients && toggleRow(cost.id)}>
                  <TableCell>
                    {cost.clients && (
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{cost.name}</span>
                      {cost.hasAnomaly && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={categoryColors[cost.category]}>
                      {cost.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(cost.lastMonth)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(cost.currentMonth)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-medium",
                        variation > 0 ? "text-destructive" : "text-success"
                      )}
                    >
                      {variation > 0 ? "+" : ""}
                      {formatPercent(variation)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(cost.perClient)}
                  </TableCell>
                </TableRow>
                {isExpanded && cost.clients && (
                  <>
                    {cost.clients.map((client, idx) => (
                      <TableRow key={`${cost.id}-${idx}`} className="bg-muted/30">
                        <TableCell></TableCell>
                        <TableCell className="pl-10 text-muted-foreground">
                          → {client.name}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(client.cost)}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
