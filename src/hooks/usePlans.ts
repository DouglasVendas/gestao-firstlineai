import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";


export interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    price_yearly: number;
    description: string | null;
    features: string[] | null;
    limits: any;
    created_at: string;
}

export const usePlans = () => {
    return useQuery({
        queryKey: ["plans"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("plans")
                .select("*")
                .order("price_monthly");

            if (error) throw error;
            return data as unknown as Plan[];
        },
    });
};

export const useCreatePlan = () => {
    return useMutation({
        mutationFn: async (newPlan: { name: string; price_monthly: number; price_yearly: number; description?: string; features?: string[]; limits?: any }) => {
            const { data, error } = await supabase
                .from("plans")
                .insert(newPlan as any)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            const queryClient = useQueryClient();
            queryClient.invalidateQueries({ queryKey: ["plans"] });
        },
    });
};
