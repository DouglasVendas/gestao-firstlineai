export const COST_CATEGORY_OPTIONS = [
  "Tecnologia e Produto",
  "Comercial e Marketing",
  "Atendimento e Sucesso",
  "Administrativo",
  "Impostos e Taxas",
  "Pessoas",
  "Outros",
] as const;

export type CostCategory = (typeof COST_CATEGORY_OPTIONS)[number];

const LEGACY_CATEGORY_MAP: Record<string, CostCategory> = {
  pessoal: "Pessoas",
  infraestrutura: "Tecnologia e Produto",
  operacional: "Administrativo",
  marketing: "Comercial e Marketing",
  comissão: "Comercial e Marketing",
  comissao: "Comercial e Marketing",
  "servidores (uso)": "Tecnologia e Produto",
  servidores: "Tecnologia e Produto",
  "taxas pagamento": "Impostos e Taxas",
  "apis de ia": "Tecnologia e Produto",
  cloud: "Tecnologia e Produto",
  gateway: "Impostos e Taxas",
  impostos: "Impostos e Taxas",
  taxas: "Impostos e Taxas",
  darf: "Impostos e Taxas",
  "simples nacional": "Impostos e Taxas",
  outros: "Outros",
};

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeCostCategory(category?: string | null): CostCategory {
  if (!category) return "Outros";

  const directMatch = COST_CATEGORY_OPTIONS.find(
    (option) => option.toLowerCase() === category.trim().toLowerCase()
  );
  if (directMatch) return directMatch;

  return LEGACY_CATEGORY_MAP[normalizeKey(category)] || "Outros";
}

export function isTaxCategory(category?: string | null) {
  const key = normalizeKey(category || "");
  return normalizeCostCategory(category) === "Impostos e Taxas"
    || key.includes("darf")
    || key.includes("simples")
    || key.includes("imposto")
    || key.includes("taxa");
}
