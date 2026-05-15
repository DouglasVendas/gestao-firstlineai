import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FinancialSettings {
    id: string;
    organization_id: string;
    initial_balance: number;
    balance_reference_date: string;
    tax_rate: number;
    accounting_method: 'cash' | 'accrual';
    budget_revenue: number;
    depreciation_monthly: number;
    financial_result_monthly: number;
    ir_csll_rate: number;
    private_discount: number;
    cac_categories: string[];
    created_at: string;
    updated_at: string;
}

export const useFinancialSettings = () => {
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ["financial_settings"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("financial_settings")
                .select("*")
                .maybeSingle();

            if (error) {
                console.error("Error fetching financial settings:", error);
                throw error;
            }

            // If no settings exist, it shouldn't happen because of migration 
            // but we provide a robust default just in case
            if (!data) {
                return {
                    initial_balance: 0,
                    balance_reference_date: new Date().toISOString(),
                    tax_rate: 0.06,
                    accounting_method: 'cash',
                    budget_revenue: 0, // P6: Fallback to 0
                    depreciation_monthly: 0,
                    financial_result_monthly: 0,
                    ir_csll_rate: 0,
                    private_discount: 0.20,
                    cac_categories: ["marketing", "anúncio", "ads", "google", "facebook", "vendas", "comercial", "comissão", "sdr", "sales"],
                } as FinancialSettings;
            }

            return data as FinancialSettings;
        },
    });

    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings: Partial<FinancialSettings>) => {
            const { data, error } = await supabase
                .from("financial_settings")
                .update(newSettings)
                .eq("id", settings?.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["financial_settings"] });
            toast.success("Configurações financeiras atualizadas!");
        },
        onError: (error: any) => {
            toast.error("Erro ao atualizar configurações: " + error.message);
        },
    });

    return {
        settings,
        isLoading,
        updateSettings: updateSettingsMutation.mutateAsync,
        isUpdating: updateSettingsMutation.isPending,
    };
};
