import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CreateTransactionInput {
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string | null;
    date: string;
    status?: string;
}

export const useCreateTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newTransaction: CreateTransactionInput) => {
            const { data, error } = await supabase
                .from("transactions")
                .insert({
                    description: newTransaction.description,
                    amount: newTransaction.amount,
                    type: newTransaction.type,
                    category: newTransaction.category,
                    date: newTransaction.date,
                    status: newTransaction.status || 'pending',
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
        },
    });
};
