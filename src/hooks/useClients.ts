import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
}

export const useClients = () => {
    return useQuery({
        queryKey: ["clients"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("clients")
                .select(`
          *,
          plan:plans(name, price_monthly, price_yearly)
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
    return useMutation({
        mutationFn: async (newClient: Omit<Client, "id" | "created_at" | "plan"> & { plan_id?: string }) => {
            const { data, error } = await supabase
                .from("clients")
                .insert({ ...newClient, contract_duration: newClient.contract_duration || 12 })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            queryClient.invalidateQueries({ queryKey: ["clients", "count"] });
            queryClient.invalidateQueries({ queryKey: ["clients", "recent"] });
        },
    });
};
