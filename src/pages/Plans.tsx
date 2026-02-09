import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, MoreHorizontal, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlans, type Plan } from "@/hooks/usePlans";
import { CreatePlanModal } from "@/components/modals/CreatePlanModal";
import { EditPlanModal } from "@/components/modals/EditPlanModal";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function Plans() {
  const { data: plans, isLoading } = usePlans();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <AppLayout title="Planos e Precificação" subtitle="Gerencie seus planos e tiers de preços">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Planos e Precificação"
      subtitle="Gerencie seus planos e tiers de preços"
    >
      {/* Actions Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-success" />
            {plans?.length || 0} planos
          </Badge>
        </div>
        <CreatePlanModal />
      </div>

      {/* Summary Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Total Clientes</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground">--</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">MRR Total</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-primary">--</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">ARPU Médio</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground">--</p>
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
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
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
                    <p className="font-mono font-medium text-foreground">{limits.storage}</p>
                    <p className="text-muted-foreground">Storage</p>
                  </div>
                  <div>
                    <p className="font-mono font-medium text-foreground">
                      {limits.apiCalls === "unlimited" ? "∞" : limits.apiCalls}
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
                  onClick={() => {
                    setSelectedPlan(plan);
                    setEditOpen(true);
                  }}
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
    </AppLayout>
  );
}
