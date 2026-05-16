import { describe, expect, it } from "vitest";
import {
  calculateCashAccountBalance,
  calculateTotalCashBalance,
  createTransferMovementDrafts,
} from "@/lib/cashAccounts";

describe("cash account calculations", () => {
  it("calculates balance from initial balance plus signed movements", () => {
    const balance = calculateCashAccountBalance(
      { id: "c6", initial_balance: 1000, active: true },
      [
        { cash_account_id: "c6", amount: 500 },
        { cash_account_id: "c6", amount: -200 },
        { cash_account_id: "other", amount: 999 },
      ],
    );

    expect(balance).toBe(1300);
  });

  it("treats initial balance date as a cutoff for already reflected movements", () => {
    const balance = calculateCashAccountBalance(
      { id: "c6", initial_balance: 6000, initial_balance_date: "2026-05-14", active: true },
      [
        { cash_account_id: "c6", amount: -1780, movement_date: "2026-05-13" },
        { cash_account_id: "c6", amount: -842.4, movement_date: "2026-05-14" },
        { cash_account_id: "c6", amount: -300, movement_date: "2026-05-15" },
      ],
    );

    expect(balance).toBe(5700);
  });

  it("sums only active account balances", () => {
    const total = calculateTotalCashBalance(
      [
        { id: "bank", initial_balance: 1000, active: true },
        { id: "gateway", initial_balance: 250, active: true },
        { id: "closed", initial_balance: 900, active: false },
      ],
      [
        { cash_account_id: "bank", amount: -100 },
        { cash_account_id: "gateway", amount: 50 },
        { cash_account_id: "closed", amount: 100 },
      ],
    );

    expect(total).toBe(1200);
  });

  it("creates balanced transfer drafts between accounts", () => {
    const drafts = createTransferMovementDrafts({
      fromAccountId: "asaas",
      toAccountId: "c6",
      amount: 1000,
      date: "2026-05-14",
      description: "Saque Asaas para C6",
    });

    expect(drafts).toEqual([
      {
        cash_account_id: "asaas",
        movement_type: "transfer_out",
        amount: -1000,
        movement_date: "2026-05-14",
        description: "Saque Asaas para C6",
      },
      {
        cash_account_id: "c6",
        movement_type: "transfer_in",
        amount: 1000,
        movement_date: "2026-05-14",
        description: "Saque Asaas para C6",
      },
    ]);
  });
});
