import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Lock, MoreHorizontal, Paperclip, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { VariableCost, useDeleteVariableCost } from "@/hooks/useVariableCosts";
import { EditVariableCostModal } from "@/components/modals/EditVariableCostModal";
import { useToast } from "@/hooks/use-toast";
import { getCostDisplayName } from "@/lib/costNames";
import { isAutomaticTaxCost } from "@/utils/automaticTaxes";

interface VariableCostsTableProps {
  costs: VariableCost[];
}

export function VariableCostsTable({ costs }: VariableCostsTableProps) {
  const [editTarget, setEditTarget] = useState<VariableCost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VariableCost | null>(null);

  const deleteCost = useDeleteVariableCost();
  const { toast } = useToast();

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCost.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: "Custo variável excluído", description: `"${getCostDisplayName(deleteTarget)}" foi removido.` });
        setDeleteTarget(null);
      },
      onError: (err) => toast({ variant: "destructive", title: "Erro ao excluir", description: err.message }),
    });
  };

  return (
    <>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Categoria</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costs.length > 0 ? (
              costs.map((cost) => {
                const isProtectedTax = isAutomaticTaxCost(cost);

                return (
                  <TableRow key={cost.id}>
                    <TableCell>
                      <Badge variant="outline">{cost.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{getCostDisplayName(cost)}</p>
                            {isProtectedTax && (
                              <Badge variant="secondary" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Automático
                              </Badge>
                            )}
                          </div>
                          {cost.description && cost.description !== getCostDisplayName(cost) && (
                            <p className="text-xs text-muted-foreground">{cost.description}</p>
                          )}
                        </div>
                        {!!cost.attachments?.length && (
                          <Badge variant="secondary" className="gap-1">
                            <Paperclip className="h-3 w-3" />
                            {cost.attachments.length}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(cost.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(cost.month).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {!isProtectedTax && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditTarget(cost)}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(cost)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhum custo variável neste mês.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EditVariableCostModal
        cost={editTarget}
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir custo variável?</AlertDialogTitle>
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
