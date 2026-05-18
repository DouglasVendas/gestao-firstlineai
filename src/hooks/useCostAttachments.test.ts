import { describe, expect, it } from "vitest";
import {
  buildCostAttachmentPath,
  sanitizeStorageFileName,
  validateCostAttachmentFile,
} from "./useCostAttachments";

describe("cost attachment helpers", () => {
  it("sanitizes filenames for storage paths", () => {
    expect(sanitizeStorageFileName("Nota Fiscal Nº 123.pdf")).toBe("nota-fiscal-n-123.pdf");
    expect(sanitizeStorageFileName(" comprovante   cartão.png ")).toBe("comprovante-cartao.png");
  });

  it("builds organization-scoped storage paths", () => {
    expect(
      buildCostAttachmentPath({
        organizationId: "org-1",
        costType: "fixed",
        costId: "cost-1",
        fileName: "Nota Fiscal.pdf",
        timestamp: 1710000000000,
      })
    ).toBe("org/org-1/costs/fixed/cost-1/1710000000000-nota-fiscal.pdf");
  });

  it("accepts only pdf and image receipt files up to 10MB", () => {
    const validPdf = new File(["pdf"], "nf.pdf", { type: "application/pdf" });
    const invalidType = new File(["csv"], "dados.csv", { type: "text/csv" });
    const largeImage = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.png", { type: "image/png" });

    expect(validateCostAttachmentFile(validPdf)).toBeNull();
    expect(validateCostAttachmentFile(invalidType)).toBe("Formato inválido. Envie PDF, PNG, JPG, JPEG ou WEBP.");
    expect(validateCostAttachmentFile(largeImage)).toBe("Arquivo muito grande. O limite é 10MB.");
  });
});
