import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BillingCycle,
  calculateSubscriptionMrr,
  ClientSubscriptionInput,
  ProductCode,
  ProductWithPlans,
} from "@/hooks/useClientSubscriptions";
import { formatCurrency } from "@/lib/formatters";

const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Mensal",
  bimonthly: "Bimestral",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  yearly: "Anual",
};

const CRM_ADDONS = [
  { addon_code: "crm_extra_users" as const, name: "Usuários adicionais" },
  { addon_code: "crm_extra_channels" as const, name: "Canais adicionais" },
];

interface ClientSubscriptionsFormProps {
  catalog: ProductWithPlans[];
  value: ClientSubscriptionInput[];
  onChange: (value: ClientSubscriptionInput[]) => void;
  defaultStartDate: string;
}

function isPlanAvailable(plan: ProductWithPlans["plans"][number], startDate: string) {
  const selected = startDate || new Date().toISOString().slice(0, 10);
  return plan.is_active && plan.starts_at <= selected && (!plan.ends_at || plan.ends_at >= selected);
}

function defaultPlanPrice(plan: ProductWithPlans["plans"][number], billingCycle: BillingCycle) {
  if (billingCycle === "yearly" && Number(plan.price_yearly || 0) > 0) {
    return Number(plan.price_yearly) / 12;
  }

  return Number(plan.price_monthly || 0);
}

function makeSubscription(product: ProductWithPlans, startDate: string): ClientSubscriptionInput {
  const plans = product.plans.filter((plan) => isPlanAvailable(plan, startDate));
  const plan = plans[0] || product.plans[0];

  return {
    product_id: product.id,
    product_code: product.code,
    product_plan_id: plan?.id || "",
    status: "active",
    billing_cycle: "monthly",
    quantity: 1,
    unit_price: plan ? defaultPlanPrice(plan, "monthly") : 0,
    start_date: startDate || null,
    end_date: null,
    addons: product.code === "crm"
      ? CRM_ADDONS.map((addon) => ({ ...addon, quantity: 0, unit_price: 0 }))
      : [],
  };
}

export function ClientSubscriptionsForm({ catalog, value, onChange, defaultStartDate }: ClientSubscriptionsFormProps) {
  const usedProductIds = new Set(value.map((subscription) => subscription.product_id));
  const availableProducts = catalog.filter((product) => !usedProductIds.has(product.id));
  const totalMrr = value.reduce((sum, subscription) => sum + calculateSubscriptionMrr(subscription), 0);

  const updateSubscription = (index: number, patch: Partial<ClientSubscriptionInput>) => {
    onChange(value.map((subscription, i) => i === index ? { ...subscription, ...patch } : subscription));
  };

  const addProduct = (productId: string) => {
    const product = catalog.find((item) => item.id === productId);
    if (!product) return;
    onChange([...value, makeSubscription(product, defaultStartDate)]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="text-base">Produtos e planos contratados</Label>
          <p className="text-xs text-muted-foreground">O MRR do cliente será calculado pela soma das assinaturas e adicionais.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">MRR total</p>
          <p className="font-semibold">{formatCurrency(totalMrr)}</p>
        </div>
      </div>

      {value.map((subscription, index) => {
        const product = catalog.find((item) => item.id === subscription.product_id);
        const plans = product?.plans.filter((plan) => isPlanAvailable(plan, subscription.start_date || defaultStartDate)) || [];
        const selectedPlan = product?.plans.find((plan) => plan.id === subscription.product_plan_id);

        return (
          <div key={`${subscription.product_id}-${index}`} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{product?.name || "Produto"}</p>
                <p className="text-xs text-muted-foreground">{product?.description}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Plano</Label>
                <Select
                  value={subscription.product_plan_id}
                  onValueChange={(planId) => {
                    const plan = product?.plans.find((item) => item.id === planId);
                    updateSubscription(index, {
                      product_plan_id: planId,
                      unit_price: plan ? defaultPlanPrice(plan, subscription.billing_cycle) : subscription.unit_price,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Ciclo</Label>
                <Select
                  value={subscription.billing_cycle}
                  onValueChange={(billingCycle: BillingCycle) => {
                    updateSubscription(index, {
                      billing_cycle: billingCycle,
                      unit_price: selectedPlan ? defaultPlanPrice(selectedPlan, billingCycle) : subscription.unit_price,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BILLING_CYCLE_LABELS).map(([cycle, label]) => (
                      <SelectItem key={cycle} value={cycle}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Início</Label>
                <Input
                  type="date"
                  value={subscription.start_date || ""}
                  onChange={(event) => updateSubscription(index, { start_date: event.target.value || null })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>MRR base</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={subscription.unit_price}
                  onChange={(event) => updateSubscription(index, { unit_price: Number(event.target.value || 0) })}
                />
              </div>
            </div>

            {subscription.product_code === "crm" && (
              <div className="grid grid-cols-2 gap-3 rounded-md bg-muted/30 p-3">
                {CRM_ADDONS.map((addon) => {
                  const current = subscription.addons.find((item) => item.addon_code === addon.addon_code) || {
                    ...addon,
                    quantity: 0,
                    unit_price: 0,
                  };

                  const updateAddon = (patch: Partial<typeof current>) => {
                    const nextAddons = CRM_ADDONS.map((item) => {
                      const existing = subscription.addons.find((stored) => stored.addon_code === item.addon_code);
                      return item.addon_code === addon.addon_code
                        ? { ...current, ...patch }
                        : existing || { ...item, quantity: 0, unit_price: 0 };
                    });
                    updateSubscription(index, { addons: nextAddons });
                  };

                  return (
                    <div key={addon.addon_code} className="space-y-2">
                      <Label>{addon.name}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={current.quantity}
                          onChange={(event) => updateAddon({ quantity: Number(event.target.value || 0) })}
                          placeholder="Qtd."
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={current.unit_price}
                          onChange={(event) => updateAddon({ unit_price: Number(event.target.value || 0) })}
                          placeholder="R$/un."
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end text-sm">
              <span className="text-muted-foreground">MRR deste produto:&nbsp;</span>
              <span className="font-medium">{formatCurrency(calculateSubscriptionMrr(subscription))}</span>
            </div>
          </div>
        );
      })}

      {availableProducts.length > 0 && (
        <Select onValueChange={addProduct}>
          <SelectTrigger>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Plus className="h-4 w-4" />
              <span>Adicionar produto</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {availableProducts.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
