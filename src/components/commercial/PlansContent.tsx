import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, MoreHorizontal, Check, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlans, type Plan } from "@/hooks/usePlans";
import { useDeletePlan } from "@/hooks/useUpdatePlan";
import { useClients } from "@/hooks/useClients";
import { CreatePlanModal } from "@/components/modals/CreatePlanModal";
import { EditPlanModal } from "@/components/modals/EditPlanModal";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export function PlansContent() {
    const { data: plans, isLoading } = usePlans();
    const { data: clients } = useClients();
    const deletePlan = useDeletePlan();
    const { toast } = useToast();

    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

    // Computed metrics from real client data
    const activeClients = clients?.filter(c => c.status === 'active' || c.status === 'trial') ?? [];
    const totalClientes = activeClients.length;
    const mrrTotal = activeClients.reduce((acc, c) => acc + (c.mrr || 0), 0);
    const arpa = totalClientes > 0 ? mrrTotal / totalClientes : 0;

    const handleDelete = () => {
        if (!deleteTarget) return;
        deletePlan.mutate(deleteTarget.id, {
            onSuccess: () => {
                toast({ title: "Plano excluído", description: `"${deleteTarget.name}" foi removido.` });
                setDeleteTarget(null);
            },
            onError: (err) => toast({ variant: "destructive", title: "Erro ao excluir", description: err.message }),
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="gap-1">
                        <span className="h-2 w-2 rounded-full bg-success" />
                        {plans?.length || 0} planos
                    </Badge>
                </div>
                <CreatePlanModal />
            </div>

            {/* Summary Stats — calculated from real client data */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="metric-card">
                    <p className="text-sm text-muted-foreground">Total Clientes</p>
                    <p className="mt-1 font-mono text-2xl font-semibold text-foreground">{totalClientes}</p>
                </div>
                <div className="metric-card">
                    <p className="text-sm text-muted-foreground">MRR Total</p>
                    <p className="mt-1 font-mono text-2xl font-semibold text-primary">{formatCurrency(mrrTotal)}</p>
                </div>
                <div className="metric-card">
                    <p className="text-sm text-muted-foreground">ARPA Médio</p>
                    <p className="mt-1 font-mono text-2xl font-semibold text-foreground">{totalClientes > 0 ? formatCurrency(arpa) : "—"}</p>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {plans?.map((plan) => {
                    const features = Array.isArray(plan.features) ? plan.features.map(String) : [];
                    const limits = plan.limits as any || { users: 0, storage: "", apiCalls: 0 };

                    return (
                        <div
                            key={plan.id}
                            className={cn("metric-card relative flex flex-col")}
                        >
                            {/* Header */}
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => { setSelectedPlan(plan); setEditOpen(true); }}>
                                            <Edit className="mr-2 h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setDeleteTarget(plan)}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Pricing */}
                            <div className="mb-4">
                                <div className="flex items-baseline gap-1">
                                    <span className="font-mono text-3xl font-bold text-foreground">
                                        {formatCurrency(plan.price_monthly)}
                                    </span>
                                    <span className="text-muted-foreground">/mês</span>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    ou {formatCurrency(plan.price_yearly)}/ano
                                </p>
                            </div>

                            {/* Features */}
                            <div className="mb-4 flex-1">
                                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Recursos
                                </p>
                                <ul className="space-y-2">
                                    {features.slice(0, 4).map((feature, index) => (
                                        <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                                            <Check className="h-4 w-4 text-success" />
                                            {feature}
                                        </li>
                                    ))}
                                    {features.length > 4 && (
                                        <li className="text-sm text-muted-foreground">
                                            +{features.length - 4} mais recursos
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {/* Limits */}
                            <div className="mb-4 rounded-lg border border-border p-3">
                                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Limites
                                </p>
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div>
                                        <p className="font-mono font-medium text-foreground">
                                            {limits.users === "unlimited" ? "∞" : limits.users}
                                        </p>
                                        <p className="text-muted-foreground">Usuários</p>
                                    </div>
                                    <div>
                                        <p className="font-mono font-medium text-foreground">{limits.storage || "—"}</p>
                                        <p className="text-muted-foreground">Storage</p>
                                    </div>
                                    <div>
                                        <p className="font-mono font-medium text-foreground">
                                            {limits.apiCalls === "unlimited" ? "∞" : (limits.apiCalls || "—")}
                                        </p>
                                        <p className="text-muted-foreground">API/mês</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => { setSelectedPlan(plan); setEditOpen(true); }}
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <EditPlanModal plan={selectedPlan} open={editOpen} onOpenChange={setEditOpen} />

            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o plano "{deleteTarget?.name}"? Clientes associados perderão a referência ao plano. Esta ação não pode ser desfeita.
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
        </div>
    );
}
