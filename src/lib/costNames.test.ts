import { describe, expect, it } from "vitest";
import { getCostDisplayName, resolveLegacyCostName } from "./costNames";

describe("cost names", () => {
  it("uses explicit name as the display title", () => {
    expect(getCostDisplayName({ name: "Supabase", description: "Plano Pro", category: "Tecnologia e Produto" })).toBe("Supabase");
  });

  it("falls back to description and then category for legacy rows", () => {
    expect(resolveLegacyCostName({ description: "Plano Pro", category: "Tecnologia e Produto" })).toBe("Plano Pro");
    expect(resolveLegacyCostName({ description: null, category: "Administrativo" })).toBe("Administrativo");
  });
});
