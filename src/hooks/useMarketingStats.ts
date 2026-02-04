import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useMarketingStats = () => {
    return useQuery({
        queryKey: ["marketing_stats"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("marketing_stats")
                .select("*")
                .order("month", { ascending: true });

            if (error) throw error;
            return data;
        },
    });
};
