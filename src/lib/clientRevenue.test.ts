import { describe, expect, it } from "vitest";
import { calculateClientProjectedRevenue, getProjectedRevenueMonths } from "./clientRevenue";
import { Client } from "@/hooks/useClients";

const baseClient: Client = {
  id: "client-1",
  name: "Cliente Teste",
  email: null,
  status: "active",
  mrr: 1000,
  start_date: "2026-01-01",
  plan_id: null,
  plan: null,
  billing_cycle: "monthly",
  products: null,
  created_at: "2026-01-01",
  churn_date: null,
  churn_reason: null,
  voluntary: null,
  contract_duration: null,
};

describe("clientRevenue", () => {
  it("projects 12 months for recurring monthly clients", () => {
    expect(getProjectedRevenueMonths(baseClient, new Date("2026-05-16"))).toBe(12);
    expect(calculateClientProjectedRevenue(baseClient, new Date("2026-05-16"))).toBe(12000);
  });

  it("projects remaining months for fixed contracts", () => {
    const yearlyClient = { ...baseClient, billing_cycle: "yearly" as const, contract_duration: 12, mrr: 12000 };

    expect(getProjectedRevenueMonths(yearlyClient, new Date("2026-05-16"))).toBe(7);
    expect(calculateClientProjectedRevenue(yearlyClient, new Date("2026-05-16"))).toBe(7000);
  });

  it("does not project churned or expired clients", () => {
    expect(calculateClientProjectedRevenue({ ...baseClient, status: "churned" }, new Date("2026-05-16"))).toBe(0);
    expect(calculateClientProjectedRevenue({ ...baseClient, billing_cycle: "yearly", contract_duration: 3 }, new Date("2026-05-16"))).toBe(0);
  });
});
