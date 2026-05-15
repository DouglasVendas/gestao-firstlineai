import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  calculateSubscriptionsMrr,
  ClientSubscriptionInput,
  saveClientSubscriptions,
} from "@/hooks/useClientSubscriptions";

interface UpdateClientData {
  id: string;
  name?: string;
  email?: string | null;
  status?: string;
  mrr?: number;
  plan_id?: string | null;
  billing_cycle?: 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'yearly';
  products?: string[];
  churn_date?: string | null;
  churn_reason?: string | null;
  voluntary?: boolean | null;
  contract_duration?: number;
  start_date?: string | null;
  subscriptions?: ClientSubscriptionInput[];
}

function legacyProductsFromSubscriptions(subscriptions: ClientSubscriptionInput[]) {
  const labels = subscriptions.map((subscription) => (
    subscription.product_code === "audit" ? "Auditoria" : "CRM"
  ));

  return Array.from(new Set(labels));
}

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, products, subscriptions, ...updates }: UpdateClientData) => {
      const normalizedUpdates = subscriptions
        ? {
            ...updates,
            mrr: calculateSubscriptionsMrr(subscriptions),
            products: legacyProductsFromSubscriptions(subscriptions),
          }
        : { ...updates, products: products as unknown as string[] };

      const { data, error } = await supabase
        .from("clients")
        .update(normalizedUpdates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (subscriptions) {
        await saveClientSubscriptions(id, subscriptions);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};
