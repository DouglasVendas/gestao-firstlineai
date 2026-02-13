import { useState } from "react";
import { ChevronDown, ChevronRight, Calculator, Building, Server, Wrench, Briefcase, Megaphone, Receipt } from "lucide-react";
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
import { FixedCost } from "@/hooks/useFixedCosts";

interface FixedCostsCategoriesProps {
  costs: FixedCost[];
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Pessoal": UsersIcon,
  "Infraestrutura": Server,
  "Operacional": Building,
  "Serviços": Wrench,
  "Marketing": Megaphone,
  "Impostos": Receipt,
};

function UsersIcon(props: any) {
  return <Briefcase {...props} />; // Fallback/Alternative
}

export function FixedCostsCategories({ costs }: FixedCostsCategoriesProps) {
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  // Group costs by category
  const categories = costs.reduce((acc, cost) => {
    if (!acc[cost.category]) {
      acc[cost.category] = [];
    }
    acc[cost.category].push(cost);
    return acc;
  }, {} as Record<string, FixedCost[]>);

  const categoryNames = Object.keys(categories).sort();

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  if (costs.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        Nenhum custo fixo registrado neste mês.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categoryNames.map((catName) => {
        const items = categories[catName];
        const totalActual = items.reduce((sum, item) => sum + Number(item.actual), 0);
        // We don't have budgeted in basic data yet, assume variance is 0 or implement budget later
        const totalBudgeted = totalActual;
        const variance = 0;
        const isOpen = openCategories.includes(catName);
        const Icon = CATEGORY_ICONS[catName] || Calculator;

        return (
          <Collapsible
            key={catName}
            open={isOpen}
            onOpenChange={() => toggleCategory(catName)}
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
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">{catName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {items.length} itens
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {/*
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-muted-foreground">Orçado</p>
                    <p className="font-medium">{formatCurrency(totalBudgeted)}</p>
                  </div>
                  */}
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Realizado</p>
                    <p className="font-medium">{formatCurrency(totalActual)}</p>
                  </div>
                  {/* Variance badge - hidden for now as we lack budget data */}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-14 mt-2 space-y-2">
                {items.map((item, idx) => {
                  return (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.description || "Sem descrição"}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-4">
                        {(item as any).status && (
                          <Badge variant={(item as any).status === 'paid' ? "success" : "warning"} className="capitalize">
                            {(item as any).status === 'paid' ? 'Pago' : 'Pendente'}
                          </Badge>
                        )}
                        <div className="text-right text-sm">
                          <span className="font-medium">{formatCurrency(item.actual)}</span>
                        </div>
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
