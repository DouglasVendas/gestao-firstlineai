import { normalizeCostCategory } from "./costCategories";

export type UnifiedImportCostType = "fixed" | "variable";

export interface ParsedUnifiedCostRow {
  type: UnifiedImportCostType;
  name: string;
  category: string;
  amount: number;
  month: string;
  dueDay: number | null;
  description: string | null;
  status: string | null;
  _error?: string;
}

const TYPE_ALIASES: Record<string, UnifiedImportCostType> = {
  fixo: "fixed",
  fixa: "fixed",
  fixed: "fixed",
  custo_fixo: "fixed",
  custos_fixos: "fixed",
  recorrente: "fixed",
  variavel: "variable",
  variável: "variable",
  variable: "variable",
  custo_variavel: "variable",
  custo_variável: "variable",
  custos_variaveis: "variable",
  pontual: "variable",
};

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .trim();
}

function getCell(row: Record<string, unknown>, ...keys: string[]) {
  const normalized = Object.entries(row).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[normalizeHeader(key)] = value;
    return acc;
  }, {});

  for (const key of keys) {
    const value = normalized[normalizeHeader(key)];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function parseAmount(value: string) {
  const cleaned = value
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveType(value: string): UnifiedImportCostType | null {
  return TYPE_ALIASES[normalizeHeader(value)] || null;
}

export function parseUnifiedCostRows(raw: Record<string, unknown>[]): ParsedUnifiedCostRow[] {
  return raw.map((row) => {
    const typeValue = getCell(row, "tipo", "tipo_custo", "tipo_lancamento", "tipo_lançamento");
    const type = resolveType(typeValue);
    const categoryValue = getCell(row, "categoria");
    const name = getCell(row, "nome", "descricao", "descrição") || categoryValue || "Custo sem nome";
    const amount = parseAmount(getCell(row, "valor", "amount", "valor_realizado", "realizado"));
    const month = getCell(row, "mes", "mês", "competencia", "competência", "data");
    const dueDayValue = getCell(row, "dia_vencimento", "vencimento", "dia_de_vencimento");
    const dueDay = dueDayValue ? Number.parseInt(dueDayValue, 10) : null;
    const description = getCell(row, "descricao", "descrição", "observacao", "observação") || null;
    const status = getCell(row, "status") || null;

    const errors: string[] = [];
    if (!type) errors.push("Tipo inválido. Use fixo ou variavel");
    if (!categoryValue) errors.push("Categoria obrigatória");
    if (!amount || amount <= 0) errors.push("Valor obrigatório");
    if (!month) errors.push("Mês obrigatório");
    if (type === "fixed" && (!dueDay || dueDay < 1 || dueDay > 31)) {
      errors.push("Dia de vencimento obrigatório para custos fixos");
    }

    return {
      type: type || "variable",
      name,
      category: categoryValue ? normalizeCostCategory(categoryValue) : "",
      amount,
      month,
      dueDay: type === "fixed" ? dueDay : null,
      description,
      status,
      _error: errors.length ? errors.join("; ") : undefined,
    };
  });
}

export const UNIFIED_COST_TEMPLATE_HEADERS = [
  "tipo",
  "nome",
  "categoria",
  "valor",
  "mes",
  "dia_vencimento",
  "descricao",
  "status",
];

export const UNIFIED_COST_TEMPLATE_EXAMPLES = [
  ["fixo", "Pró Labore Douglas", "Pessoas", "1780", "2026-05-01", "10", "Pagamento mensal", "pending"],
  ["variavel", "Google Ads", "Comercial e Marketing", "997", "2026-05-13", "", "Campanha maio", "paid"],
];
