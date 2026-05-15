import { describe, expect, it } from "vitest";
import { parseUnifiedCostRows } from "./costImport";

describe("unified cost import", () => {
  it("parses mixed fixed and variable cost rows from one spreadsheet", () => {
    const rows = parseUnifiedCostRows([
      {
        tipo: "fixo",
        nome: "Pró Labore Douglas",
        categoria: "Pessoas",
        valor: "1780,50",
        mes: "2026-05-01",
        dia_vencimento: "10",
        descricao: "Pagamento mensal",
      },
      {
        tipo: "variavel",
        nome: "Google Ads",
        categoria: "Comercial e Marketing",
        valor: "997",
        mes: "2026-05-13",
        descricao: "Campanha maio",
      },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      type: "fixed",
      name: "Pró Labore Douglas",
      category: "Pessoas",
      amount: 1780.5,
      month: "2026-05-01",
      dueDay: 10,
      description: "Pagamento mensal",
    });
    expect(rows[1]).toMatchObject({
      type: "variable",
      name: "Google Ads",
      category: "Comercial e Marketing",
      amount: 997,
      month: "2026-05-13",
      dueDay: null,
      description: "Campanha maio",
    });
  });

  it("marks invalid rows without blocking valid rows", () => {
    const rows = parseUnifiedCostRows([
      { tipo: "mensal", nome: "Sem tipo", categoria: "Pessoas", valor: "100", mes: "2026-05-01" },
      { tipo: "fixo", nome: "Sem vencimento", categoria: "Pessoas", valor: "100", mes: "2026-05-01" },
      { tipo: "custo_variavel", nome: "Software", categoria: "Tecnologia e Produto", valor: "200", mes: "2026-05-01" },
    ]);

    expect(rows[0]._error).toContain("Tipo inválido");
    expect(rows[1]._error).toContain("Dia de vencimento obrigatório");
    expect(rows[2]._error).toBeUndefined();
    expect(rows[2].type).toBe("variable");
  });
});
