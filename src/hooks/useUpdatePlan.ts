import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UpdatePlanData {
  id: string;
  name?: string;
  description?: string | null;
  price_monthly?: number;
  price_yearly?: number;
  features?: string[];
  limits?: any;
}

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdatePlanData) => {
      const { data, error } = await supabase
        .from("plans")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
};
