import { normalizeCostCategory } from "./costCategories";

export type UnifiedImportCostType = "fixed" | "variable";
export type UnifiedImportStatus = "pending" | "paid" | "canceled";

export interface ParsedUnifiedCostRow {
  type: UnifiedImportCostType;
  name: string;
  category: string;
  amount: number;
  month: string;
  dueDay: number | null;
  description: string | null;
  status: UnifiedImportStatus;
  paidAt: string | null;
  paymentAccountName: string | null;
  impactCash: boolean;
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

const STATUS_ALIASES: Record<string, UnifiedImportStatus> = {
  pendente: "pending",
  pending: "pending",
  aberto: "pending",
  pago: "paid",
  paga: "paid",
  paid: "paid",
  liquidado: "paid",
  quitado: "paid",
  cancelado: "canceled",
  cancelada: "canceled",
  canceled: "canceled",
  cancelled: "canceled",
};

const YES_VALUES = new Set(["sim", "s", "yes", "y", "true", "1"]);
const NO_VALUES = new Set(["nao", "não", "n", "no", "false", "0", ""]);

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
  const raw = value.replace(/R\$/gi, "").replace(/\s/g, "");
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");

  let normalized = raw;
  if (hasComma) {
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else if (hasDot) {
    const parts = raw.split(".");
    const lastPart = parts[parts.length - 1];
    normalized = parts.length === 2 && lastPart.length <= 2
      ? raw
      : raw.replace(/\./g, "");
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveType(value: string): UnifiedImportCostType | null {
  return TYPE_ALIASES[normalizeHeader(value)] || null;
}

export function normalizeImportStatus(value?: string | null): UnifiedImportStatus {
  return STATUS_ALIASES[normalizeHeader(value || "")] || "pending";
}

function parseImpactCash(value: string) {
  const normalized = normalizeHeader(value);
  if (YES_VALUES.has(normalized)) return true;
  if (NO_VALUES.has(normalized)) return false;
  return false;
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
    const status = normalizeImportStatus(getCell(row, "status"));
    const paidAt = getCell(row, "data_pagamento", "pago_em", "paid_at", "data_do_pagamento") || null;
    const paymentAccountName = getCell(row, "conta_pagamento", "conta", "conta_saida", "conta_de_saida") || null;
    const impactCash = parseImpactCash(getCell(row, "impactar_caixa", "impacta_caixa", "gerar_movimento_caixa"));

    const errors: string[] = [];
    if (!type) errors.push("Tipo inválido. Use fixo ou variavel");
    if (!categoryValue) errors.push("Categoria obrigatória");
    if (!amount || amount <= 0) errors.push("Valor obrigatório");
    if (!month) errors.push("Mês obrigatório");
    if (type === "fixed" && (!dueDay || dueDay < 1 || dueDay > 31)) {
      errors.push("Dia de vencimento obrigatório para custos fixos");
    }
    if (status === "paid" && !paidAt) {
      errors.push("Data de pagamento obrigatória para status pago");
    }
    if (status === "paid" && impactCash && !paymentAccountName) {
      errors.push("Conta de pagamento obrigatória quando impactar caixa for sim");
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
      paidAt,
      paymentAccountName,
      impactCash,
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
  "data_pagamento",
  "conta_pagamento",
  "impactar_caixa",
];

export const UNIFIED_COST_TEMPLATE_EXAMPLES = [
  ["variavel", "J.A. Contabilidade", "Administrativo", "890", "2025-08-26", "", "Pago via Inter PF Lucas", "pago", "2025-08-26", "Inter PF Lucas", "nao"],
  ["variavel", "Google Ads", "Comercial e Marketing", "997", "2026-05-13", "", "Campanha maio", "pago", "2026-05-13", "Santander PJ", "sim"],
  ["fixo", "Pró Labore Douglas", "Pessoas", "1780", "2026-05-01", "10", "Pagamento mensal", "pendente", "", "", "nao"],
];
