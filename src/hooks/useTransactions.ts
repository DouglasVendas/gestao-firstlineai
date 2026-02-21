import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Transaction {
    id: string;
    description: string;
    category: string | null;
    amount: number;
    type: 'income' | 'expense' | 'entrada' | 'saida';
    status: 'pending' | 'completed' | 'cancelled';
    date: string;
    created_at: string;
}

export const useTransactions = () => {
    return useQuery({
        queryKey: ["transactions"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .order("date", { ascending: false });

            if (error) throw error;
            return data as unknown as Transaction[];
        },
    });
};
