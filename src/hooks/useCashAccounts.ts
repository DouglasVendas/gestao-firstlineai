import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth/AuthContext";
import { resolveActiveOrganizationId } from "@/hooks/useCostAttachments";
import {
  calculateCashAccountBalance,
  calculateTotalCashBalance,
  CashAccountType,
  CashMovementType,
  CashSourceType,
  createTransferMovementDrafts,
} from "@/lib/cashAccounts";

export interface CashAccount {
  id: string;
  organization_id: string;
  type: CashAccountType;
  name: string;
  bank_name: string | null;
  agency: string | null;
  account_number: string | null;
  initial_balance: number;
  initial_balance_date: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CashMovement {
  id: string;
  organization_id: string;
  cash_account_id: string;
  movement_type: CashMovementType;
  amount: number;
  movement_date: string;
  description: string;
  source_type: CashSourceType;
  source_id: string | null;
  transfer_group_id: string | null;
  created_at: string;
  created_by: string | null;
  account?: Pick<CashAccount, "name" | "type"> | null;
}

export interface CashAccountWithBalance extends CashAccount {
  current_balance: number;
}

interface CreateCashAccountInput {
  type: CashAccountType;
  name: string;
  bank_name?: string | null;
  agency?: string | null;
  account_number?: string | null;
  initial_balance: number;
  initial_balance_date: string;
  active?: boolean;
}

interface UpdateCashAccountInput extends Partial<CreateCashAccountInput> {
  id: string;
}

export interface UpsertCashMovementInput {
  cashAccountId: string;
  movementType: CashMovementType;
  amount: number;
  movementDate: string;
  description: string;
  sourceType: CashSourceType;
  sourceId?: string | null;
}

interface CreateTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  description: string;
}

export function withAccountBalances(accounts: CashAccount[], movements: CashMovement[]) {
  return accounts.map((account) => ({
    ...account,
    current_balance: calculateCashAccountBalance(account, movements),
  }));
}

export const useCashAccounts = () => {
  return useQuery({
    queryKey: ["cash_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_accounts" as any)
        .select("*")
        .order("active", { ascending: false })
        .order("name");

      if (error) throw error;
      return (data || []) as CashAccount[];
    },
  });
};

export const useCashMovements = () => {
  return useQuery({
    queryKey: ["cash_movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_movements" as any)
        .select("*, account:cash_accounts(name,type)")
        .order("movement_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as CashMovement[];
    },
  });
};

export const useCashSummary = () => {
  const accountsQuery = useCashAccounts();
  const movementsQuery = useCashMovements();
  const accounts = accountsQuery.data || [];
  const movements = movementsQuery.data || [];
  const accountsWithBalance = withAccountBalances(accounts, movements);

  return {
    accounts,
    movements,
    accountsWithBalance,
    totalCashBalance: calculateTotalCashBalance(accounts, movements),
    isLoading: accountsQuery.isLoading || movementsQuery.isLoading,
    error: accountsQuery.error || movementsQuery.error,
  };
};

export const useCreateCashAccount = () => {
  const queryClient = useQueryClient();
  const { organizationId, user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateCashAccountInput) => {
      const orgId = await resolveActiveOrganizationId(organizationId);
      if (!orgId) throw new Error("Organização não identificada para criar conta financeira.");

      const { data, error } = await supabase
        .from("cash_accounts" as any)
        .insert({
          ...input,
          organization_id: orgId,
          created_by: user?.id || null,
          active: input.active ?? true,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as CashAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash_accounts"] });
      queryClient.invalidateQueries({ queryKey: ["financial_snapshot"] });
    },
  });
};

export const useUpdateCashAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateCashAccountInput) => {
      const { data, error } = await supabase
        .from("cash_accounts" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as CashAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash_accounts"] });
      queryClient.invalidateQueries({ queryKey: ["financial_snapshot"] });
    },
  });
};

export const useUpsertCashMovement = () => {
  const queryClient = useQueryClient();
  const { organizationId, user } = useAuth();

  return useMutation({
    mutationFn: (input: UpsertCashMovementInput) => upsertCashMovement({
      ...input,
      organizationId,
      userId: user?.id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash_movements"] });
      queryClient.invalidateQueries({ queryKey: ["cash_accounts"] });
      queryClient.invalidateQueries({ queryKey: ["financial_snapshot"] });
    },
  });
};

export const useDeleteCashMovementForSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCashMovementForSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash_movements"] });
      queryClient.invalidateQueries({ queryKey: ["cash_accounts"] });
      queryClient.invalidateQueries({ queryKey: ["financial_snapshot"] });
    },
  });
};

export const useCreateCashTransfer = () => {
  const queryClient = useQueryClient();
  const { organizationId, user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateTransferInput) => {
      const orgId = await resolveActiveOrganizationId(organizationId);
      if (!orgId) throw new Error("Organização não identificada para transferir caixa.");

      const transferGroupId = crypto.randomUUID();
      const drafts = createTransferMovementDrafts(input).map((movement) => ({
        ...movement,
        organization_id: orgId,
        source_type: "transfer",
        transfer_group_id: transferGroupId,
        created_by: user?.id || null,
      }));

      const { data, error } = await supabase
        .from("cash_movements" as any)
        .insert(drafts as any)
        .select();

      if (error) throw error;
      return data as CashMovement[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash_movements"] });
      queryClient.invalidateQueries({ queryKey: ["cash_accounts"] });
      queryClient.invalidateQueries({ queryKey: ["financial_snapshot"] });
    },
  });
};

export async function upsertCashMovement(input: UpsertCashMovementInput & { organizationId?: string | null; userId?: string | null }) {
  const orgId = await resolveActiveOrganizationId(input.organizationId);
  if (!orgId) throw new Error("Organização não identificada para movimentar caixa.");
  if (!input.cashAccountId) throw new Error("Informe a conta financeira.");
  if (!input.amount) throw new Error("Informe um valor para a movimentação.");

  const payload = {
    organization_id: orgId,
    cash_account_id: input.cashAccountId,
    movement_type: input.movementType,
    amount: input.amount,
    movement_date: input.movementDate,
    description: input.description,
    source_type: input.sourceType,
    source_id: input.sourceId || null,
    created_by: input.userId || null,
  };

  if (input.sourceId) {
    const { data: existing, error: findError } = await supabase
      .from("cash_movements" as any)
      .select("id")
      .eq("source_type", input.sourceType)
      .eq("source_id", input.sourceId)
      .maybeSingle();

    if (findError) throw findError;
    if (existing?.id) {
      const { data, error } = await supabase
        .from("cash_movements" as any)
        .update(payload as any)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as CashMovement;
    }
  }

  const { data, error } = await supabase
    .from("cash_movements" as any)
    .insert(payload as any)
    .select()
    .single();

  if (error) throw error;
  return data as CashMovement;
}

export async function deleteCashMovementForSource(input: { sourceType: CashSourceType; sourceId: string }) {
  const { error } = await supabase
    .from("cash_movements" as any)
    .delete()
    .eq("source_type", input.sourceType)
    .eq("source_id", input.sourceId);

  if (error) throw error;
}
