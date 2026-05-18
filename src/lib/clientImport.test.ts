import { describe, expect, it } from "vitest";
import {
  findExistingClientImportMatch,
  normalizeClientImportKey,
  parseClientImportRows,
  parseClientMoney,
} from "./clientImport";

describe("client import", () => {
  it("normalizes client keys by email first", () => {
    expect(normalizeClientImportKey({ name: "Empresa X", email: "  CONTATO@Empresa.com " }))
      .toBe("email:contato@empresa.com");
  });

  it("falls back to normalized name when email is missing", () => {
    expect(normalizeClientImportKey({ name: "  Empresa   Sem   Email  ", email: "" }))
      .toBe("name:empresa sem email");
  });

  it("parses Brazilian and plain money formats for MRR", () => {
    expect(parseClientMoney("2990")).toBe(2990);
    expect(parseClientMoney("2.990")).toBe(2990);
    expect(parseClientMoney("2.990,50")).toBe(2990.5);
    expect(parseClientMoney("2990.50")).toBe(2990.5);
  });

  it("marks duplicated clients inside the same spreadsheet", () => {
    const rows = parseClientImportRows([
      { nome: "Empresa Exemplo", email: "contato@empresa.com", mrr: "997" },
      { nome: "Empresa Exemplo LTDA", email: "CONTATO@empresa.com", mrr: "997" },
    ]);

    expect(rows[0]._error).toBeUndefined();
    expect(rows[1]._error).toContain("Cliente duplicado");
  });

  it("finds existing clients by normalized key", () => {
    const [row] = parseClientImportRows([
      { nome: "Empresa Exemplo", email: "contato@empresa.com" },
    ]);

    const match = findExistingClientImportMatch(row, [
      { id: "client-1", name: "Empresa Exemplo", email: "CONTATO@empresa.com" },
    ]);

    expect(match?.id).toBe("client-1");
  });
});
