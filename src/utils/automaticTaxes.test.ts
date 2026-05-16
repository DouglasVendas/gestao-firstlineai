import { describe, expect, it } from "vitest";
import {
  buildAutomaticTaxRows,
  isAutomaticTaxCost,
  TAX_CATEGORY,
  TAX_NAME,
} from "./automaticTaxes";

describe("automatic tax costs", () => {
  it("creates one variable tax cost per paid revenue month due on day 20", () => {
    const rows = buildAutomaticTaxRows({
      invoices: [
        { value: 1000, status: "paid", paid_date: "2026-05-03" },
        { value: 500, status: "pago", paid_date: "2026-05-21" },
        { value: 700, status: "pending", paid_date: "2026-05-09" },
        { value: 200, status: "paid", paid_date: null },
        { value: 300, status: "paid", paid_date: "2026-06-02" },
      ],
      existingCosts: [],
      taxRate: 0.06,
      organizationId: "org-1",
    });

    expect(rows).toEqual([
      {
        amount: 90,
        category: TAX_CATEGORY,
        description: "AUTO_GERADO - Imposto sobre recebimentos confirmados (Mai/26)",
        is_auto_generated: true,
        month: "2026-05-20",
        name: TAX_NAME,
        organization_id: "org-1",
        status: "pending",
      },
      {
        amount: 18,
        category: TAX_CATEGORY,
        description: "AUTO_GERADO - Imposto sobre recebimentos confirmados (Jun/26)",
        is_auto_generated: true,
        month: "2026-06-20",
        name: TAX_NAME,
        organization_id: "org-1",
        status: "pending",
      },
    ]);
  });

  it("updates the existing automatic tax row instead of creating duplicates", () => {
    const rows = buildAutomaticTaxRows({
      invoices: [{ value: 2000, status: "paid", paid_date: "2026-05-11" }],
      existingCosts: [
        {
          id: "tax-1",
          amount: 60,
          category: TAX_CATEGORY,
          description: "old",
          is_auto_generated: true,
          month: "2026-05-20",
          name: TAX_NAME,
          status: "pending",
        },
      ],
      taxRate: 0.06,
      organizationId: "org-1",
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "tax-1",
      amount: 120,
      month: "2026-05-20",
    });
  });

  it("identifies protected automatic tax costs", () => {
    expect(isAutomaticTaxCost({
      category: TAX_CATEGORY,
      is_auto_generated: true,
      name: TAX_NAME,
    })).toBe(true);

    expect(isAutomaticTaxCost({
      category: TAX_CATEGORY,
      is_auto_generated: false,
      name: TAX_NAME,
    })).toBe(false);
  });
});
