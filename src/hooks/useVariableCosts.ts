import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VariableCost {
    id: string;
    category: string;
    amount: number;
    description: string | null;
    month: string; // ISO date YYYY-MM-DD
    status: 'pending' | 'paid' | 'cancelled';
    is_auto_generated: boolean;
    created_at: string;
}

export const useVariableCosts = () => {
    return useQuery({
        queryKey: ["variable_costs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("variable_costs")
                .select("*")
                .order("month", { ascending: true }); // Likely want most recent? But sorting by month implies history

            if (error) throw error;
            return data as unknown as VariableCost[];
        },
    });
};

export const useCreateVariableCost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newCost: Omit<VariableCost, "id" | "created_at">) => {
            const { data, error } = await supabase
                .from("variable_costs")
                .insert(newCost as any)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["variable_costs"] });
        },
    });
};
