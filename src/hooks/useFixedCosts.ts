import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FixedCost {
    id: string;
    category: string;
    description: string | null;
    budgeted: number;
    actual: number;
    due_day: number | null; // e.g., day of month
    created_at: string;
    month: string | null;
}

export const useFixedCosts = () => {
    return useQuery({
        queryKey: ["fixed_costs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("fixed_costs")
                .select("*")
                .order("category");

            if (error) throw error;
            return data as unknown as FixedCost[];
        },
    });
};

export const useCreateFixedCost = () => {
    return useMutation({
        mutationFn: async (newCost: Omit<FixedCost, "id" | "created_at">) => {
            const { data, error } = await supabase
                .from("fixed_costs")
                .insert(newCost as any)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            const queryClient = useQueryClient();
            queryClient.invalidateQueries({ queryKey: ["fixed_costs"] });
        },
    });
};
