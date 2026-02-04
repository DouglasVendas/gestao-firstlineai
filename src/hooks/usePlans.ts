import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePlans = () => {
    return useQuery({
        queryKey: ["plans"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("plans")
                .select("*")
                .order("price_monthly");

            if (error) throw error;
            return data;
        },
    });
};
