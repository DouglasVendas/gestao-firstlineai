import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";


export interface Invoice {
    id: string;
    client_id: string | null;
    value: number;
    due_date: string;
    status: 'paid' | 'pending' | 'overdue' | 'canceled';
    paid_date: string | null;
    created_at: string;
    client?: {
        name: string;
    } | null;
}

export interface CreateInvoiceInput {
    client_id: string; // Now required (not nullable) — enforced by DB constraint
    value: number;
    due_date: string;
    status: 'paid' | 'pending' | 'overdue' | 'canceled';
    paid_date: string | null;
}

export const useInvoices = () => {
    return useQuery({
        queryKey: ["invoices"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("invoices")
                .select(`
          *,
          client:clients(name)
        `)
                .order("due_date");

            if (error) throw error;
            return data as unknown as Invoice[];
        },
    });
};

export const useCreateInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newInvoice: CreateInvoiceInput) => {
            const { data, error } = await supabase
                .from("invoices")
                .insert(newInvoice)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
        },
    });
};
