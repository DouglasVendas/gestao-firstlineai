import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { startOfMonth, format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth/AuthContext";
import {
    CostAttachment,
    resolveActiveOrganizationId,
    uploadCostAttachments,
} from "@/hooks/useCostAttachments";
import { CostCategory } from "@/lib/costCategories";
import {
    buildFixedCostOccurrence,
    FixedCostOccurrence,
    FixedCostPayment,
    FixedCostPaymentStatus,
    FixedCostRecurringStatus,
    getRecurringEndMonth,
    RecurringFixedCost,
} from "@/lib/fixedCostRecurrences";
import { deleteCashMovementForSource, upsertCashMovement } from "@/hooks/useCashAccounts";

interface CreateFixedCostData {
  name: string;
  category: CostCategory;
  description?: string | null;
  amount: number;
  due_day: number;
  start_month: string;
  duration_months?: number | null;
  end_month?: string | null;
  attachmentFiles?: File[];
}

interface UpdateFixedCostData extends Partial<CreateFixedCostData> {
  id: string;
  recurring_id?: string;
  status?: FixedCostRecurringStatus;
}

interface EnsurePaymentData {
  occurrence: FixedCost;
  status?: FixedCostPaymentStatus;
  paid_at?: string | null;
  notes?: string | null;
  cashAccountId?: string | null;
  attachmentFiles?: File[];
}

export type FixedCost = FixedCostOccurrence;

function monthInputToDate(value: string) {
    return `${value.slice(0, 7)}-01`;
}

function buildRecurringPayload(input: CreateFixedCostData, orgId: string, userId?: string | null) {
    const startDate = monthInputToDate(input.start_month);
    const endDate = input.end_month
        ? monthInputToDate(input.end_month)
        : getRecurringEndMonth(startDate, input.duration_months || null);

    return {
        organization_id: orgId,
        name: input.name,
        description: input.description || null,
        category: input.category,
        amount: input.amount,
        due_date_day: input.due_day,
        start_date: startDate,
        end_date: endDate,
        duration_months: input.duration_months || null,
        status: "active" as FixedCostRecurringStatus,
        active: true,
        created_by: userId || null,
    };
}

function matchPayment(payments: FixedCostPayment[] | undefined, recurringId: string, selectedMonth: Date) {
    const month = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
    return payments?.find((payment) => (
        payment.recurring_fixed_cost_id === recurringId
        && payment.reference_month?.slice(0, 10) === month
    ));
}

export async function fetchFixedCostOccurrences(selectedMonth: Date) {
    const { data: recurringData, error: recurringError } = await supabase
        .from("recurring_fixed_costs" as any)
        .select("*")
        .order("category");

    if (recurringError) throw recurringError;

    const month = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
    const { data: paymentsData, error: paymentsError } = await supabase
        .from("fixed_cost_payments" as any)
        .select("*, attachments:cost_attachments(*)")
        .eq("reference_month", month);

    if (paymentsError) throw paymentsError;

    const payments = (paymentsData || []) as FixedCostPayment[];

    return ((recurringData || []) as RecurringFixedCost[])
        .map((recurring) => buildFixedCostOccurrence({
            recurring,
            selectedMonth,
            payment: matchPayment(payments, recurring.id, selectedMonth),
        }))
        .filter(Boolean) as FixedCost[];
}

export const useFixedCosts = (selectedMonth = new Date()) => {
    return useQuery({
        queryKey: ["fixed_costs", format(startOfMonth(selectedMonth), "yyyy-MM-dd")],
        queryFn: () => fetchFixedCostOccurrences(selectedMonth),
    });
};

export const useCreateFixedCost = () => {
    const queryClient = useQueryClient();
    const { organizationId, user } = useAuth();

    return useMutation({
        mutationFn: async (newCost: CreateFixedCostData) => {
            const { attachmentFiles, ...input } = newCost;
            const orgId = await resolveActiveOrganizationId(organizationId);
            if (!orgId) throw new Error("Organização não identificada para criar custo.");

            const { data, error } = await supabase
                .from("recurring_fixed_costs" as any)
                .insert(buildRecurringPayload(input, orgId, user?.id) as any)
                .select()
                .single();

            if (error) throw error;

            if (attachmentFiles?.length) {
                const occurrence = buildFixedCostOccurrence({
                    recurring: data as RecurringFixedCost,
                    selectedMonth: parseISO(monthInputToDate(input.start_month)),
                });
                if (occurrence) {
                    await ensureFixedCostPayment({
                        occurrence,
                        status: "pending",
                        attachmentFiles,
                        userId: user?.id,
                    });
                }
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fixed_costs"] });
            queryClient.invalidateQueries({ queryKey: ["financial_metrics"] });
            queryClient.invalidateQueries({ queryKey: ["financial_snapshot"] });
        },
    });
};

export const useUpdateFixedCost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, recurring_id, attachmentFiles: _attachmentFiles, ...updates }: UpdateFixedCostData) => {
            const recurringId = recurring_id || id;
            const payload: Record<string, unknown> = {};

            if (updates.name !== undefined) payload.name = updates.name;
            if (updates.category !== undefined) payload.category = updates.category;
            if (updates.description !== undefined) payload.description = updates.description || null;
            if (updates.amount !== undefined) payload.amount = updates.amount;
            if (updates.due_day !== undefined) payload.due_date_day = updates.due_day;
            if (updates.start_month !== undefined) payload.start_date = monthInputToDate(updates.start_month);
            if (updates.duration_months !== undefined) payload.duration_months = updates.duration_months || null;
            if (updates.end_month !== undefined) payload.end_date = updates.end_month ? monthInputToDate(updates.end_month) : null;
            if (updates.status !== undefined) {
                payload.status = updates.status;
                payload.active = updates.status === "active";
            }

            if (payload.start_date && updates.duration_months) {
                payload.end_date = getRecurringEndMonth(payload.start_date as string, updates.duration_months);
            }

            const { data, error } = await supabase
                .from("recurring_fixed_costs" as any)
                .update(payload as any)
                .eq("id", recurringId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fixed_costs"] });
            queryClient.invalidateQueries({ queryKey: ["financial_metrics"] });
            queryClient.invalidateQueries({ queryKey: ["financial_snapshot"] });
        },
    });
};

async function ensureFixedCostPayment({
    occurrence,
    status = "pending",
    paid_at = null,
    notes = null,
    cashAccountId = null,
    attachmentFiles,
    userId,
}: EnsurePaymentData & { userId?: string | null }) {
    let payment = occurrence.payment;

    if (!payment) {
        const { data, error } = await supabase
            .from("fixed_cost_payments" as any)
            .insert({
                recurring_fixed_cost_id: occurrence.recurring_id,
                organization_id: occurrence.organization_id,
                reference_month: occurrence.month,
                due_date: occurrence.due_date,
                amount: occurrence.actual,
                status,
                paid_at,
                notes,
                cash_account_id: cashAccountId,
                created_by: userId || null,
            } as any)
            .select()
            .single();

        if (error) throw error;
        payment = data as FixedCostPayment;
    } else {
        const { data, error } = await supabase
            .from("fixed_cost_payments" as any)
            .update({ status, paid_at, notes, amount: occurrence.actual, cash_account_id: cashAccountId } as any)
            .eq("id", payment.id)
            .select()
            .single();

        if (error) throw error;
        payment = data as FixedCostPayment;
    }

    await uploadCostAttachments({
        files: attachmentFiles,
        costId: payment.id,
        costType: "fixed",
        organizationId: occurrence.organization_id,
        userId,
        fixedCostPaymentId: payment.id,
    });

    if (status === "paid" && cashAccountId) {
        await upsertCashMovement({
            cashAccountId,
            movementType: "expense",
            amount: -Math.abs(Number(occurrence.actual)),
            movementDate: paid_at || occurrence.due_date,
            description: occurrence.name || "Pagamento de custo fixo",
            sourceType: "fixed_cost_payment",
            sourceId: payment.id,
            organizationId: occurrence.organization_id,
            userId,
        });
    } else if (payment.id) {
        await deleteCashMovementForSource({ sourceType: "fixed_cost_payment", sourceId: payment.id });
    }

    return payment;
}

export const useSaveFixedCostPayment = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: (data: EnsurePaymentData) => ensureFixedCostPayment({ ...data, userId: user?.id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fixed_costs"] });
            queryClient.invalidateQueries({ queryKey: ["cash_movements"] });
            queryClient.invalidateQueries({ queryKey: ["cash_accounts"] });
            queryClient.invalidateQueries({ queryKey: ["financial_metrics"] });
            queryClient.invalidateQueries({ queryKey: ["financial_snapshot"] });
        },
    });
};

export const useDeleteFixedCost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("recurring_fixed_costs" as any).delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fixed_costs"] });
            queryClient.invalidateQueries({ queryKey: ["financial_metrics"] });
            queryClient.invalidateQueries({ queryKey: ["financial_snapshot"] });
        },
    });
};
