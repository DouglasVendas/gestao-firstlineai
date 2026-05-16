import { describe, expect, it } from "vitest";
import { computeExpectedInvoices, mergeInvoicesInRange } from "./computeInvoices";
import type { Client } from "@/hooks/useClients";
import type { Invoice } from "@/hooks/useInvoices";

const client = (overrides: Partial<Client>): Client => ({
  id: "client-1",
  name: "Cliente Teste",
  email: null,
  status: "active",
  mrr: 100,
  start_date: "2026-01-10",
  plan_id: null,
  plan: null,
  billing_cycle: "monthly",
  products: null,
  created_at: "2026-01-01T00:00:00.000Z",
  churn_date: null,
  churn_reason: null,
  voluntary: null,
  contract_duration: 12,
  ...overrides,
});

const invoice = (overrides: Partial<Invoice>): Invoice => ({
  id: "invoice-1",
  client_id: "client-1",
  value: 100,
  due_date: "2026-05-15",
  status: "pending",
  paid_date: null,
  created_at: "2026-05-01T00:00:00.000Z",
  client: { name: "Cliente Teste" },
  ...overrides,
});

describe("mergeInvoicesInRange", () => {
  it("keeps real invoices whose due date is inside the selected from/to period", () => {
    const result = mergeInvoicesInRange(
      [
        invoice({ id: "inside", due_date: "2026-05-15" }),
        invoice({ id: "outside", due_date: "2026-06-01" }),
      ],
      [],
      { from: new Date(2026, 4, 1), to: new Date(2026, 4, 31) },
      new Date(2026, 4, 1)
    );

    expect(result.map((item) => item.id)).toEqual(["inside"]);
  });

  it("generates expected invoices for every month inside the selected period", () => {
    const result = mergeInvoicesInRange(
      [],
      [client({ id: "client-1", start_date: "2026-01-10" })],
      { from: new Date(2026, 4, 1), to: new Date(2026, 5, 30) },
      new Date(2026, 4, 1)
    );

    expect(result.map((item) => item.id)).toEqual([
      "computed-client-1-2026-05",
      "computed-client-1-2026-06",
    ]);
  });

  it("does not generate a computed invoice when a real invoice already exists for the client/month", () => {
    const result = mergeInvoicesInRange(
      [invoice({ id: "real-may", due_date: "2026-05-15" })],
      [client({ id: "client-1", start_date: "2026-01-10" })],
      { from: new Date(2026, 4, 1), to: new Date(2026, 4, 31) },
      new Date(2026, 4, 1)
    );

    expect(result.map((item) => item.id)).toEqual(["real-may"]);
  });

  it("uses normalized MRR for expected invoices so annual clients are not multiplied twice", () => {
    const result = computeExpectedInvoices([
      client({
        id: "annual-client",
        mrr: 12000,
        billing_cycle: "yearly",
        start_date: "2026-01-10",
      }),
    ], new Date(2027, 0, 1));

    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(12000);
  });
});
