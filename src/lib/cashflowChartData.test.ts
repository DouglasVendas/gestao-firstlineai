import { describe, expect, it } from "vitest";
import { buildCashflowChartData } from "./cashflowChartData";

describe("cashflow chart data", () => {
  it("uses the selected date range months instead of a fixed six-month window", () => {
    const data = buildCashflowChartData(
      [
        { type: "entrada", amount: 1000, date: "2025-07-10", category: "Venda" },
        { type: "saida", amount: 200, date: "2025-11-15", category: "Administrativo" },
      ],
      new Date(2026, 4, 1),
      { from: new Date(2025, 6, 1), to: new Date(2025, 10, 30) },
    );

    expect(data.map((point) => point.month)).toEqual(["jul/25", "ago/25", "set/25", "out/25", "nov/25"]);
    expect(data.at(-1)?.saldo).toBe(800);
  });

  it("counts only visible days in partial first and last months", () => {
    const data = buildCashflowChartData(
      [
        { type: "entrada", amount: 100, date: "2025-07-01", category: "Venda" },
        { type: "entrada", amount: 300, date: "2025-07-20", category: "Venda" },
        { type: "saida", amount: 50, date: "2025-08-05", category: "Pessoas" },
        { type: "saida", amount: 70, date: "2025-08-25", category: "Pessoas" },
      ],
      new Date(2025, 6, 1),
      { from: new Date(2025, 6, 15), to: new Date(2025, 7, 10) },
    );

    expect(data).toMatchObject([
      { month: "jul/25", entradas: 300, saidas: 0 },
      { month: "ago/25", entradas: 0, saidas: 50 },
    ]);
  });

  it("excludes investment returns from operational entries", () => {
    const data = buildCashflowChartData(
      [
        { type: "entrada", amount: 1000, date: "2025-07-10", category: "Venda" },
        { type: "entrada", amount: 500, date: "2025-07-11", category: "Investimento" },
      ],
      new Date(2025, 6, 1),
      { from: new Date(2025, 6, 1), to: new Date(2025, 6, 31) },
    );

    expect(data[0].entradas).toBe(1000);
    expect(data[0].saldo).toBe(1500);
  });
});
