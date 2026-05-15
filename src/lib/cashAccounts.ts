export type CashAccountType = "bank" | "gateway" | "cash" | "other";
export type CashMovementType = "income" | "expense" | "transfer_in" | "transfer_out" | "adjustment";
export type CashSourceType = "manual" | "invoice" | "fixed_cost_payment" | "variable_cost" | "transfer" | "adjustment";

export interface CashAccountBalanceInput {
  id: string;
  initial_balance: number;
  initial_balance_date?: string | null;
  active: boolean;
}

export interface CashMovementBalanceInput {
  cash_account_id: string;
  amount: number;
  movement_date?: string | null;
}

export interface CashTransferDraftInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  description: string;
}

export interface CashTransferMovementDraft {
  cash_account_id: string;
  movement_type: "transfer_in" | "transfer_out";
  amount: number;
  movement_date: string;
  description: string;
}

export function calculateCashAccountBalance(
  account: CashAccountBalanceInput,
  movements: CashMovementBalanceInput[],
) {
  const cutoffDate = account.initial_balance_date?.slice(0, 10) || null;

  return movements
    .filter((movement) => movement.cash_account_id === account.id)
    .filter((movement) => {
      if (!cutoffDate || !movement.movement_date) return true;
      return movement.movement_date.slice(0, 10) > cutoffDate;
    })
    .reduce((sum, movement) => sum + Number(movement.amount || 0), Number(account.initial_balance || 0));
}

export function calculateTotalCashBalance(
  accounts: CashAccountBalanceInput[],
  movements: CashMovementBalanceInput[],
) {
  return accounts
    .filter((account) => account.active)
    .reduce((sum, account) => sum + calculateCashAccountBalance(account, movements), 0);
}

export function createTransferMovementDrafts(input: CashTransferDraftInput): CashTransferMovementDraft[] {
  const amount = Math.abs(Number(input.amount || 0));
  if (!input.fromAccountId || !input.toAccountId) {
    throw new Error("Informe as contas de origem e destino da transferência.");
  }
  if (input.fromAccountId === input.toAccountId) {
    throw new Error("A conta de origem deve ser diferente da conta de destino.");
  }
  if (amount <= 0) {
    throw new Error("O valor da transferência deve ser maior que zero.");
  }

  return [
    {
      cash_account_id: input.fromAccountId,
      movement_type: "transfer_out",
      amount: -amount,
      movement_date: input.date,
      description: input.description,
    },
    {
      cash_account_id: input.toAccountId,
      movement_type: "transfer_in",
      amount,
      movement_date: input.date,
      description: input.description,
    },
  ];
}
