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
        status: "pendente",
      },
      {
        tipo: "variavel",
        nome: "Google Ads",
        categoria: "Comercial e Marketing",
        valor: "997",
        mes: "2026-05-13",
        descricao: "Campanha maio",
        status: "pago",
        data_pagamento: "2026-05-13",
        conta_pagamento: "Santander PJ",
        impactar_caixa: "sim",
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
      status: "pending",
      paidAt: null,
      paymentAccountName: null,
      impactCash: false,
    });
    expect(rows[1]).toMatchObject({
      type: "variable",
      name: "Google Ads",
      category: "Comercial e Marketing",
      amount: 997,
      month: "2026-05-13",
      dueDay: null,
      description: "Campanha maio",
      status: "paid",
      paidAt: "2026-05-13",
      paymentAccountName: "Santander PJ",
      impactCash: true,
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

  it("parses decimal values with Brazilian or international separators", () => {
    const rows = parseUnifiedCostRows([
      { tipo: "variavel", nome: "Decimal BR", categoria: "Pessoas", valor: "2.465,90", mes: "2026-05-01" },
      { tipo: "variavel", nome: "Decimal dot", categoria: "Pessoas", valor: "2465.90", mes: "2026-05-01" },
      { tipo: "variavel", nome: "Thousands only", categoria: "Pessoas", valor: "2.465", mes: "2026-05-01" },
    ]);

    expect(rows[0].amount).toBe(2465.9);
    expect(rows[1].amount).toBe(2465.9);
    expect(rows[2].amount).toBe(2465);
  });

  it("requires payment date for paid rows and account only when cash impact is enabled", () => {
    const rows = parseUnifiedCostRows([
      { tipo: "variavel", nome: "Pago sem data", categoria: "Pessoas", valor: "100", mes: "2026-05-01", status: "pago" },
      { tipo: "variavel", nome: "Impacta caixa sem conta", categoria: "Pessoas", valor: "100", mes: "2026-05-01", status: "pago", data_pagamento: "2026-05-01", impactar_caixa: "sim" },
      { tipo: "variavel", nome: "Histórico sem caixa", categoria: "Pessoas", valor: "100", mes: "2026-05-01", status: "pago", data_pagamento: "2026-05-01", impactar_caixa: "nao" },
    ]);

    expect(rows[0]._error).toContain("Data de pagamento obrigatória");
    expect(rows[1]._error).toContain("Conta de pagamento obrigatória");
    expect(rows[2]._error).toBeUndefined();
    expect(rows[2].impactCash).toBe(false);
  });
});
