import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CreateBudgetInput {
    category: string;
    budgeted: number;
    actual?: number;
    month?: string;
}

export const useCreateBudget = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newBudget: CreateBudgetInput) => {
            const { data, error } = await supabase
                .from("budget")
                .insert({
                    category: newBudget.category,
                    budgeted: newBudget.budgeted,
                    actual: newBudget.actual || 0,
                    month: newBudget.month || null,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budget"] });
        },
    });
};
