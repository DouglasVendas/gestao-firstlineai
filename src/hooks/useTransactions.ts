import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTransactions = () => {
    return useQuery({
        queryKey: ["transactions"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .order("date", { ascending: false });

            if (error) throw error;
            return data;
        },
    });
};
