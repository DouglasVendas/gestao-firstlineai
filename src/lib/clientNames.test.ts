import { describe, expect, it } from "vitest";
import { formatClientName } from "./clientNames";

describe("formatClientName", () => {
  it("normalizes common person and company name casing", () => {
    expect(formatClientName("angel lira tecnologia e rastreamento")).toBe("Angel Lira Tecnologia e Rastreamento");
    expect(formatClientName("ANTONY SOUZA GOMES")).toBe("Antony Souza Gomes");
    expect(formatClientName("DAIANE BOTTCHER")).toBe("Daiane Bottcher");
  });

  it("preserves business acronyms and suffixes", () => {
    expect(formatClientName("BFR ASSESSOR DE INVESTIMENTOS LTDA")).toBe("BFR Assessor de Investimentos Ltda");
    expect(formatClientName("empresa teste ME")).toBe("Empresa Teste ME");
    expect(formatClientName("BFR s/a")).toBe("BFR S/A");
  });
});
