export interface CostNamingFields {
  name?: string | null;
  description?: string | null;
  category?: string | null;
}

function clean(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function resolveLegacyCostName(cost: CostNamingFields) {
  return clean(cost.description) || clean(cost.category) || "Saída sem nome";
}

export function getCostDisplayName(cost: CostNamingFields) {
  return clean(cost.name) || resolveLegacyCostName(cost);
}
