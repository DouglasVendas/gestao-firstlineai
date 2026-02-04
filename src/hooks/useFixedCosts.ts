import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFixedCosts = () => {
    return useQuery({
        queryKey: ["fixed_costs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("fixed_costs")
                .select("*")
                .order("category");

            if (error) throw error;
            return data;
        },
    });
};
