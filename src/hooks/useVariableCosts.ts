import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useVariableCosts = () => {
    return useQuery({
        queryKey: ["variable_costs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("variable_costs")
                .select("*")
                .order("month", { ascending: true });

            if (error) throw error;
            return data;
        },
    });
};
