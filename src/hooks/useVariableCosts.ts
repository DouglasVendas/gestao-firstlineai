import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth/AuthContext";
import {
    CostAttachment,
    deleteCostAttachmentsForCost,
    resolveActiveOrganizationId,
    uploadCostAttachments,
} from "@/hooks/useCostAttachments";
import { isAutomaticTaxCost } from "@/utils/automaticTaxes";
import { deleteCashMovementForSource, upsertCashMovement } from "@/hooks/useCashAccounts";

interface UpdateVariableCostData {
  id: string;
  name?: string;
  category?: string;
  amount?: number;
  description?: string | null;
  month?: string;
  status?: "pending" | "paid" | "canceled" | null;
  cash_account_id?: string | null;
  paid_at?: string | null;
}

export interface VariableCost {
    id: string;
    name: string;
    category: string;
    amount: number;
    description: string | null;
    month: string; // ISO date YYYY-MM-DD
    status: 'pending' | 'paid' | 'canceled';
    paid_at?: string | null;
    is_auto_generated?: boolean;
    created_at: string;
    organization_id?: string;
    cash_account_id?: string | null;
    attachments?: CostAttachment[];
}

type VariableCostPayload = Omit<VariableCost, "id" | "created_at" | "attachments"> & {
    attachmentFiles?: File[];
};

export const useVariableCosts = () => {
    return useQuery({
        queryKey: ["variable_costs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("variable_costs")
                .select("*, attachments:cost_attachments(*)")
                .order("month", { ascending: true }); // Likely want most recent? But sorting by month implies history

            if (error) throw error;
            return data as unknown as VariableCost[];
        },
    });
};

export const useCreateVariableCost = () => {
    const queryClient = useQueryClient();
    const { organizationId, user } = useAuth();
    return useMutation({
        mutationFn: async (newCost: VariableCostPayload) => {
            const { attachmentFiles, ...costPayload } = newCost;
            const orgId = await resolveActiveOrganizationId(organizationId);
            if (!orgId) throw new Error("Organização não identificada para criar custo.");

            const { data, error } = await supabase
                .from("variable_costs")
                .insert({ ...costPayload, organization_id: orgId } as any)
                .select()
                .single();

            if (error) throw error;

            await uploadCostAttachments({
                files: attachmentFiles,
                costId: data.id,
                costType: "variable",
                organizationId: orgId,
                userId: user?.id,
            });

            if (data.status === "paid" && data.cash_account_id) {
                await upsertCashMovement({
                    cashAccountId: data.cash_account_id,
                    movementType: "expense",
                    amount: -Math.abs(Number(data.amount)),
                    movementDate: data.paid_at || data.month,
                    description: data.name || data.description || "Pagamento de custo variável",
                    sourceType: "variable_cost",
                    sourceId: data.id,
                    organizationId: orgId,
                    userId: user?.id,
                });
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["variable_costs"] });
            queryClient.invalidateQueries({ queryKey: ["cash_movements"] });
            queryClient.invalidateQueries({ queryKey: ["cash_accounts"] });
            queryClient.invalidateQueries({ queryKey: ["financial_metrics"] });
            queryClient.invalidateQueries({ queryKey: ["financial_snapshot"] });
        },
    });
};

export const useUpdateVariableCost = () => {
    const queryClient = useQueryClient();
    const { organizationId, user } = useAuth();
    return useMutation({
        mutationFn: async ({ id, attachmentFiles, ...updates }: UpdateVariableCostData & { attachmentFiles?: File[] }) => {
            const { data: existing, error: existingError } = await supabase
                .from("variable_costs")
                .select("id, name, category, is_auto_generated")
                .eq("id", id)
                .single();

            if (existingError) throw existingError;
            if (isAutomaticTaxCost(existing as any)) {
                throw new Error("Este imposto é automático. Edite apenas o percentual em custos variáveis.");
            }

            const { data, error } = await supabase
                .from("variable_costs")
                .update(updates as any)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;

            const orgId = await resolveActiveOrganizationId(data.organization_id || organizationId);
            if (!orgId) throw new Error("Organização não identificada para anexar comprovante.");

            await uploadCostAttachments({
                files: attachmentFiles,
                costId: id,
                costType: "variable",
                organizationId: orgId,
                userId: user?.id,
            });

            if (data.status === "paid" && data.cash_account_id) {
                await upsertCashMovement({
                    cashAccountId: data.cash_account_id,
                    movementType: "expense",
                    amount: -Math.abs(Number(data.amount)),
                    movementDate: data.paid_at || data.month,
                    description: data.name || data.description || "Pagamento de custo variável",
                    sourceType: "variable_cost",
                    sourceId: data.id,
                    organizationId: orgId,
                    userId: user?.id,
                });
            } else {
                await deleteCashMovementForSource({ sourceType: "variable_cost", sourceId: id });
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["variable_costs"] });
            queryClient.invalidateQueries({ queryKey: ["cash_movements"] });
            queryClient.invalidateQueries({ queryKey: ["cash_accounts"] });
            queryClient.invalidateQueries({ queryKey: ["financial_metrics"] });
            queryClient.invalidateQueries({ queryKey: ["financial_snapshot"] });
        },
    });
};

export const useDeleteVariableCost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data: existing, error: existingError } = await supabase
                .from("variable_costs")
                .select("id, name, category, is_auto_generated")
                .eq("id", id)
                .single();

            if (existingError) throw existingError;
            if (isAutomaticTaxCost(existing as any)) {
                throw new Error("Este imposto é automático e não pode ser removido.");
            }

            await deleteCostAttachmentsForCost("variable", id);
            await deleteCashMovementForSource({ sourceType: "variable_cost", sourceId: id });
            const { error } = await supabase.from("variable_costs").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["variable_costs"] });
            queryClient.invalidateQueries({ queryKey: ["cash_movements"] });
            queryClient.invalidateQueries({ queryKey: ["cash_accounts"] });
            queryClient.invalidateQueries({ queryKey: ["financial_metrics"] });
            queryClient.invalidateQueries({ queryKey: ["financial_snapshot"] });
        },
    });
};
