import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth/AuthContext";
import {
    calculateSubscriptionsMrr,
    ClientSubscription,
    ClientSubscriptionInput,
    saveClientSubscriptions,
} from "@/hooks/useClientSubscriptions";

export interface Client {
    id: string;
    name: string;
    email: string | null;
    status: string;
    mrr: number;
    start_date: string | null;
    plan_id: string | null;
    plan: {
        name: string;
        price_monthly: number;
        price_yearly: number;
    } | null;
    billing_cycle: 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'yearly' | null;
    products: string[] | null;
    created_at: string;
    churn_date: string | null;
    churn_reason: string | null;
    voluntary: boolean | null;
    contract_duration: number | null;
    subscriptions?: ClientSubscription[];
}

async function resolveOrganizationId(organizationId: string | null) {
    if (organizationId) return organizationId;

    const { data: fsData } = await supabase
        .from("financial_settings")
        .select("organization_id")
        .limit(1)
        .maybeSingle();

    if (fsData?.organization_id) return fsData.organization_id;

    const { data: clientData } = await supabase
        .from("clients")
        .select("organization_id")
        .limit(1)
        .maybeSingle();

    return clientData?.organization_id || null;
}

function legacyProductsFromSubscriptions(subscriptions: ClientSubscriptionInput[]) {
    const labels = subscriptions.map((subscription) => (
        subscription.product_code === "audit" ? "Auditoria" : "CRM"
    ));

    return Array.from(new Set(labels));
}

// P2 & P3: Helper function to get normalized monthly MRR
export function getEffectiveMRR(client: Client): number {
    // Priority 1: Use plan price if linked
    if (client.plan) {
        if (client.billing_cycle === 'yearly') {
            return (Number(client.plan.price_yearly) || 0) / 12;
        }
        return Number(client.plan.price_monthly) || 0;
    }

    // Priority 2: Use manual MRR if no plan
    const rawValue = Number(client.mrr) || 0;

    // Normalization logic for manual MRR based on cycle (P2)
    if (!client.billing_cycle || client.billing_cycle === 'monthly') {
        return rawValue;
    }

    const cycleMonths: Record<string, number> = {
        bimonthly: 2,
        quarterly: 3,
        semiannual: 6,
        yearly: 12,
    };

    const months = cycleMonths[client.billing_cycle] || 1;
    return rawValue / months;
}

export const useClients = () => {
    return useQuery({
        queryKey: ["clients"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("clients")
                .select(`
          *,
          plan:plans(name, price_monthly, price_yearly),
          subscriptions:client_subscriptions(
            *,
            product:products(*),
            plan:product_plans(*),
            addons:client_subscription_addons(*)
          )
        `)
                .order("name");

            if (error) throw error;
            return data as unknown as Client[];
        },
    });
};

export const useClientsCount = () => {
    return useQuery({
        queryKey: ["clients", "count"],
        queryFn: async () => {
            const { count, error } = await supabase
                .from("clients")
                .select("*", { count: "exact", head: true })
                .eq("status", "active");

            if (error) throw error;
            return count || 0;
        },
    });
};

export const useRecentClients = () => {
    return useQuery({
        queryKey: ["clients", "recent"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("clients")
                .select(`
          *,
          plan:plans(name)
        `)
                .order("created_at", { ascending: false })
                .limit(5);

            if (error) throw error;
            return data as unknown as Client[];
        },
    });
};

export const useCreateClient = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useAuth();

    return useMutation({
        mutationFn: async (
            newClient: Omit<Client, "id" | "created_at" | "plan"> & {
                plan_id?: string;
                subscriptions?: ClientSubscriptionInput[];
            }
        ) => {
            const { subscriptions = [], ...clientPayload } = newClient;
            const orgId = await resolveOrganizationId(organizationId);
            if (!orgId) throw new Error("Organização não identificada para criar cliente.");

            const mrr = subscriptions.length > 0
                ? calculateSubscriptionsMrr(subscriptions)
                : clientPayload.mrr;

            const { data, error } = await supabase
                .from("clients")
                .insert({
                    ...clientPayload,
                    organization_id: orgId,
                    mrr,
                    products: subscriptions.length > 0
                        ? legacyProductsFromSubscriptions(subscriptions)
                        : clientPayload.products,
                    contract_duration: clientPayload.contract_duration || 12,
                } as any)
                .select()
                .single();

            if (error) throw error;

            if (subscriptions.length > 0) {
                await saveClientSubscriptions(data.id, subscriptions);
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            queryClient.invalidateQueries({ queryKey: ["clients", "count"] });
            queryClient.invalidateQueries({ queryKey: ["clients", "recent"] });
        },
    });
};
