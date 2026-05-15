import { useState } from "react";
import { ChevronDown, ChevronRight, Calculator, Building, Server, HeartHandshake, Briefcase, Megaphone, Receipt, MoreHorizontal, Pencil, Trash2, Paperclip, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FixedCost, useDeleteFixedCost } from "@/hooks/useFixedCosts";
import { EditFixedCostModal } from "@/components/modals/EditFixedCostModal";
import { useToast } from "@/hooks/use-toast";
import { getCostDisplayName } from "@/lib/costNames";

interface FixedCostsCategoriesProps {
  costs: FixedCost[];
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Tecnologia e Produto": Server,
  "Comercial e Marketing": Megaphone,
  "Atendimento e Sucesso": HeartHandshake,
  "Administrativo": Building,
  "Impostos e Taxas": Receipt,
  "Pessoas": Users,
  "Outros": Briefcase,
};

export function FixedCostsCategories({ costs }: FixedCostsCategoriesProps) {
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [editTarget, setEditTarget] = useState<FixedCost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FixedCost | null>(null);

  const deleteCost = useDeleteFixedCost();
  const { toast } = useToast();

  const categories = costs.reduce((acc, cost) => {
    if (!acc[cost.category]) acc[cost.category] = [];
    acc[cost.category].push(cost);
    return acc;
  }, {} as Record<string, FixedCost[]>);

  const categoryNames = Object.keys(categories).sort();

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCost.mutate(deleteTarget.recurring_id, {
      onSuccess: () => {
        toast({ title: "Custo excluído", description: `"${getCostDisplayName(deleteTarget)}" foi removido.` });
        setDeleteTarget(null);
      },
      onError: (err) => toast({ variant: "destructive", title: "Erro ao excluir", description: err.message }),
    });
  };

  if (costs.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        Nenhum custo fixo registrado neste mês.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {categoryNames.map((catName) => {
          const items = categories[catName];
          const totalActual = items.reduce((sum, item) => sum + Number(item.actual), 0);
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
                      <p className="text-sm text-muted-foreground">{items.length} itens</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Realizado</p>
                      <p className="font-medium">{formatCurrency(totalActual)}</p>
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-14 mt-2 space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm font-medium">{getCostDisplayName(item)}</p>
                            {item.description && item.description !== getCostDisplayName(item) && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                          {!!item.attachments?.length && (
                            <Badge variant="secondary" className="gap-1">
                              <Paperclip className="h-3 w-3" />
                              {item.attachments.length}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-3">
                        {item.status && (
                          <Badge variant={item.status === "overdue" ? "destructive" : item.status === "paid" ? "default" : "secondary"} className="capitalize">
                            {item.status === 'paid' ? 'Pago' : item.status === 'overdue' ? 'Atrasado' : item.status === 'canceled' ? 'Cancelado' : 'Pendente'}
                          </Badge>
                        )}
                        <div className="text-right text-xs text-muted-foreground">
                          Vence {new Date(`${item.due_date}T12:00:00`).toLocaleDateString("pt-BR")}
                        </div>
                        <div className="text-right text-sm">
                          <span className="font-medium">{formatCurrency(item.actual)}</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditTarget(item)}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(item)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      <EditFixedCostModal
        cost={editTarget}
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir custo fixo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget ? getCostDisplayName(deleteTarget) : ""}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
