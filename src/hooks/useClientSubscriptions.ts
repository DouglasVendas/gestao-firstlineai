import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProductCode = "audit" | "crm";
export type AddonCode = "crm_extra_users" | "crm_extra_channels";
export type BillingCycle = "monthly" | "bimonthly" | "quarterly" | "semiannual" | "yearly";
export type SubscriptionStatus = "active" | "trial" | "churned" | "inactive";

export interface Product {
  id: string;
  code: ProductCode;
  name: string;
  description: string | null;
}

export interface ProductPlan {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface ProductWithPlans extends Product {
  plans: ProductPlan[];
}

export interface SubscriptionAddonInput {
  addon_code: AddonCode;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface ClientSubscriptionInput {
  product_id: string;
  product_code: ProductCode;
  product_plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  quantity: number;
  unit_price: number;
  start_date: string | null;
  end_date?: string | null;
  addons: SubscriptionAddonInput[];
}

export interface ClientSubscription extends Omit<ClientSubscriptionInput, "product_code"> {
  id: string;
  client_id: string;
  product: Product;
  plan: ProductPlan;
  addons: Array<SubscriptionAddonInput & { id: string; subscription_id: string }>;
}

export function calculateSubscriptionMrr(subscription: Pick<ClientSubscriptionInput, "quantity" | "unit_price" | "addons">) {
  const base = Number(subscription.unit_price || 0) * Number(subscription.quantity || 1);
  const addons = (subscription.addons || []).reduce(
    (sum, addon) => sum + Number(addon.quantity || 0) * Number(addon.unit_price || 0),
    0
  );
  return base + addons;
}

export function calculateSubscriptionsMrr(subscriptions: ClientSubscriptionInput[]) {
  return subscriptions.reduce((sum, subscription) => sum + calculateSubscriptionMrr(subscription), 0);
}

export const useProductCatalog = () => {
  return useQuery({
    queryKey: ["product_catalog"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select("*, plans:product_plans(*)")
        .order("name", { ascending: true });

      if (error) throw error;

      return (data || []).map((product: any) => ({
        ...product,
        plans: [...(product.plans || [])].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
      })) as ProductWithPlans[];
    },
  });
};

export const useClientSubscriptions = (clientId?: string | null) => {
  return useQuery({
    queryKey: ["client_subscriptions", clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("client_subscriptions")
        .select("*, product:products(*), plan:product_plans(*), addons:client_subscription_addons(*)")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []).map((subscription: any) => ({
        id: subscription.id,
        client_id: subscription.client_id,
        product_id: subscription.product_id,
        product: subscription.product,
        product_plan_id: subscription.product_plan_id,
        plan: subscription.plan,
        status: subscription.status,
        billing_cycle: subscription.billing_cycle,
        quantity: subscription.quantity,
        unit_price: Number(subscription.unit_price || 0),
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        addons: (subscription.addons || []).map((addon: any) => ({
          id: addon.id,
          subscription_id: addon.subscription_id,
          addon_code: addon.addon_code,
          name: addon.name,
          quantity: addon.quantity,
          unit_price: Number(addon.unit_price || 0),
        })),
      })) as ClientSubscription[];
    },
  });
};

export const saveClientSubscriptions = async (clientId: string, subscriptions: ClientSubscriptionInput[]) => {
  const { error: deleteError } = await (supabase as any)
    .from("client_subscriptions")
    .delete()
    .eq("client_id", clientId);

  if (deleteError) throw deleteError;

  for (const subscription of subscriptions) {
    const { data, error } = await (supabase as any)
      .from("client_subscriptions")
      .insert({
        client_id: clientId,
        product_id: subscription.product_id,
        product_plan_id: subscription.product_plan_id,
        status: subscription.status,
        billing_cycle: subscription.billing_cycle,
        quantity: subscription.quantity,
        unit_price: subscription.unit_price,
        start_date: subscription.start_date,
        end_date: subscription.end_date || null,
      })
      .select("id")
      .single();

    if (error) throw error;

    const addons = subscription.addons
      .filter((addon) => addon.quantity > 0 || addon.unit_price > 0)
      .map((addon) => ({
        subscription_id: data.id,
        addon_code: addon.addon_code,
        name: addon.name,
        quantity: addon.quantity,
        unit_price: addon.unit_price,
      }));

    if (addons.length > 0) {
      const { error: addonError } = await (supabase as any)
        .from("client_subscription_addons")
        .insert(addons);

      if (addonError) throw addonError;
    }
  }
};

export const useSaveClientSubscriptions = (clientId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscriptions: ClientSubscriptionInput[]) => {
      if (!clientId) throw new Error("Cliente não identificado.");
      await saveClientSubscriptions(clientId, subscriptions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_subscriptions", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};
