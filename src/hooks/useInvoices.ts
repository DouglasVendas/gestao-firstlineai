import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
            return data;
        },
    });
};
