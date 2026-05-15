export const CLIENT_BILLING_CYCLE_MAP: Record<string, string> = {
  mensal: "monthly",
  monthly: "monthly",
  bimestral: "bimonthly",
  bimonthly: "bimonthly",
  trimestral: "quarterly",
  quarterly: "quarterly",
  semestral: "semiannual",
  semiannual: "semiannual",
  anual: "yearly",
  yearly: "yearly",
};

export const CLIENT_STATUS_MAP: Record<string, string> = {
  ativo: "active",
  active: "active",
  trial: "trial",
  cancelado: "churned",
  churned: "churned",
  inativo: "inactive",
  inactive: "inactive",
};

export interface ParsedClientImportRow {
  name: string;
  email: string | null;
  plan_name: string;
  billing_cycle: string;
  mrr: number;
  status: string;
  start_date: string | null;
  products: string[];
  churn_reason: string | null;
  churn_date: string | null;
  dedupe_key: string;
  _error?: string;
}

export interface ExistingClientImportMatch {
  id: string;
  name: string;
  email: string | null;
}

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeClientImportKey(input: { name?: string | null; email?: string | null }) {
  const email = normalizeWhitespace(input.email || "").toLowerCase();
  if (email) return `email:${email}`;

  const name = normalizeWhitespace(input.name || "").toLowerCase();
  return name ? `name:${name}` : "";
}

export function parseClientMoney(value: string) {
  const cleaned = value
    .trim()
    .replace(/[R$\s]/g, "")
    .replace(/[^\d,.-]/g, "");

  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma > lastDot) {
    return Number(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  }

  if (lastDot > lastComma && lastComma >= 0) {
    return Number(cleaned.replace(/,/g, "")) || 0;
  }

  if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    return Number(cleaned.replace(/\./g, "")) || 0;
  }

  return Number(cleaned.replace(",", ".")) || 0;
}

export function parseClientImportRows(raw: any[]): ParsedClientImportRow[] {
  const seen = new Map<string, number>();

  return raw
    .map((row, index) => {
      const get = (key: string) => {
        const found = Object.keys(row).find(
          (k) => k.toLowerCase().trim() === key.toLowerCase()
        );
        return found ? String(row[found] ?? "").trim() : "";
      };

      const name = normalizeWhitespace(get("nome"));
      const email = normalizeWhitespace(get("email")) || null;

      if (!name) {
        return {
          name: "",
          email,
          plan_name: "",
          billing_cycle: "monthly",
          mrr: 0,
          status: "active",
          start_date: null,
          products: [],
          churn_reason: null,
          churn_date: null,
          dedupe_key: "",
          _error: "Nome obrigatório",
        };
      }

      const productsRaw = get("produtos");
      const products = productsRaw
        ? productsRaw.split(",").map((p) => normalizeWhitespace(p)).filter(Boolean)
        : [];

      const parsed: ParsedClientImportRow = {
        name,
        email,
        plan_name: normalizeWhitespace(get("plano")),
        billing_cycle: CLIENT_BILLING_CYCLE_MAP[get("ciclo_cobranca").toLowerCase()] || "monthly",
        mrr: parseClientMoney(get("mrr")),
        status: CLIENT_STATUS_MAP[get("status").toLowerCase()] || "active",
        start_date: get("data_inicio") || null,
        products,
        churn_reason: get("motivo_churn") || null,
        churn_date: get("data_churn") || null,
        dedupe_key: normalizeClientImportKey({ name, email }),
      };

      if (parsed.dedupe_key) {
        const firstRow = seen.get(parsed.dedupe_key);
        if (firstRow !== undefined) {
          parsed._error = `Cliente duplicado na planilha. Já aparece na linha ${firstRow + 2}.`;
        } else {
          seen.set(parsed.dedupe_key, index);
        }
      }

      return parsed;
    })
    .filter((row) => row.name || row._error);
}

export function findExistingClientImportMatch(
  row: ParsedClientImportRow,
  clients: ExistingClientImportMatch[]
) {
  return clients.find((client) => normalizeClientImportKey(client) === row.dedupe_key) || null;
}
