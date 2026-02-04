import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardData = () => {
  return useQuery({
    queryKey: ["financial_metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_metrics")
        .select("*")
        .order("month", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};
