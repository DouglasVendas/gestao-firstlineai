import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CostItem {
  name: string;
  budgeted: number;
  actual: number;
  dueDate?: string;
}

interface CostCategory {
  id: string;
  name: string;
  icon: string;
  items: CostItem[];
}

const categories: CostCategory[] = [
  {
    id: "pessoal",
    name: "Pessoal",
    icon: "👥",
    items: [
      { name: "Salários CLT", budgeted: 85000, actual: 85000 },
      { name: "Pró-labore", budgeted: 25000, actual: 25000 },
      { name: "INSS/FGTS/Encargos", budgeted: 28000, actual: 27500 },
      { name: "13º (provisionamento)", budgeted: 7000, actual: 7000 },
      { name: "Férias (provisionamento)", budgeted: 9500, actual: 9500 },
      { name: "Benefícios (VR/VT/Saúde)", budgeted: 15000, actual: 14800 },
    ],
  },
  {
    id: "infra",
    name: "Infraestrutura",
    icon: "🖥️",
    items: [
      { name: "AWS (base fixa)", budgeted: 8000, actual: 8000 },
      { name: "Vercel", budgeted: 500, actual: 500 },
      { name: "GitHub Enterprise", budgeted: 1200, actual: 1200 },
      { name: "Datadog", budgeted: 800, actual: 800 },
    ],
  },
  {
    id: "operacional",
    name: "Operacional",
    icon: "🏢",
    items: [
      { name: "Aluguel", budgeted: 8500, actual: 8500, dueDate: "2024-01-05" },
      { name: "Condomínio", budgeted: 1200, actual: 1200, dueDate: "2024-01-10" },
      { name: "Energia", budgeted: 800, actual: 750, dueDate: "2024-01-15" },
      { name: "Internet", budgeted: 500, actual: 500, dueDate: "2024-01-20" },
    ],
  },
  {
    id: "servicos",
    name: "Serviços Profissionais",
    icon: "📋",
    items: [
      { name: "Contabilidade", budgeted: 2500, actual: 2500, dueDate: "2024-01-10" },
      { name: "Jurídico", budgeted: 3000, actual: 2800 },
      { name: "Consultoria", budgeted: 5000, actual: 4500 },
    ],
  },
  {
    id: "marketing",
    name: "Marketing Fixo",
    icon: "📢",
    items: [
      { name: "HubSpot", budgeted: 4500, actual: 4500 },
      { name: "SEMrush", budgeted: 800, actual: 800 },
      { name: "Figma", budgeted: 600, actual: 600 },
    ],
  },
  {
    id: "impostos",
    name: "Impostos Fixos",
    icon: "📊",
    items: [
      { name: "Simples Nacional", budgeted: 32000, actual: 31500, dueDate: "2024-01-20" },
      { name: "Taxas municipais", budgeted: 500, actual: 500 },
    ],
  },
];

export function FixedCostsCategories() {
  const [openCategories, setOpenCategories] = useState<string[]>(["pessoal"]);

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const totalBudgeted = category.items.reduce((sum, item) => sum + item.budgeted, 0);
        const totalActual = category.items.reduce((sum, item) => sum + item.actual, 0);
        const variance = ((totalActual - totalBudgeted) / totalBudgeted) * 100;
        const isOpen = openCategories.includes(category.id);

        return (
          <Collapsible
            key={category.id}
            open={isOpen}
            onOpenChange={() => toggleCategory(category.id)}
          >
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <span className="text-xl">{category.icon}</span>
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.items.length} itens
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Orçado</p>
                    <p className="font-medium">{formatCurrency(totalBudgeted)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Realizado</p>
                    <p className="font-medium">{formatCurrency(totalActual)}</p>
                  </div>
                  <Badge
                    variant={variance <= 0 ? "default" : "destructive"}
                    className={cn(
                      "min-w-16 justify-center",
                      variance <= 0 && "bg-success/10 text-success border-success/20"
                    )}
                  >
                    {variance > 0 ? "+" : ""}
                    {variance.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-14 mt-2 space-y-2">
                {category.items.map((item, idx) => {
                  const itemVariance = item.actual - item.budgeted;
                  const progress = (item.actual / item.budgeted) * 100;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.name}</span>
                          {item.dueDate && (
                            <Badge variant="outline" className="text-xs">
                              Venc: {new Date(item.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                            </Badge>
                          )}
                        </div>
                        <Progress value={Math.min(progress, 100)} className="mt-2 h-1" />
                      </div>
                      <div className="ml-4 flex items-center gap-4">
                        <div className="text-right text-sm">
                          <span className="text-muted-foreground">{formatCurrency(item.actual)}</span>
                          <span className="mx-1 text-muted-foreground">/</span>
                          <span>{formatCurrency(item.budgeted)}</span>
                        </div>
                        <span
                          className={cn(
                            "min-w-14 text-right text-sm font-medium",
                            itemVariance < 0 ? "text-success" : itemVariance > 0 ? "text-destructive" : "text-muted-foreground"
                          )}
                        >
                          {itemVariance !== 0 && (itemVariance > 0 ? "+" : "")}
                          {itemVariance !== 0 ? formatCurrency(itemVariance) : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
