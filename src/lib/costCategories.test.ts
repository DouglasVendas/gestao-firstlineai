import { describe, expect, it } from "vitest";
import { normalizeCostCategory, isTaxCategory } from "./costCategories";

describe("cost categories", () => {
  it("normalizes legacy categories into the simplified SaaS categories", () => {
    expect(normalizeCostCategory("Pessoal")).toBe("Pessoas");
    expect(normalizeCostCategory("Infraestrutura")).toBe("Tecnologia e Produto");
    expect(normalizeCostCategory("Servidores (Uso)")).toBe("Tecnologia e Produto");
    expect(normalizeCostCategory("Comissão")).toBe("Comercial e Marketing");
    expect(normalizeCostCategory("Operacional")).toBe("Administrativo");
    expect(normalizeCostCategory("Taxas Pagamento")).toBe("Impostos e Taxas");
  });

  it("detects tax and fee categories for DRE deductions", () => {
    expect(isTaxCategory("Impostos e Taxas")).toBe(true);
    expect(isTaxCategory("DARF mensal")).toBe(true);
    expect(isTaxCategory("Tecnologia e Produto")).toBe(false);
  });
});
