import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const TAX_NAME = "Imposto sobre Recebimentos";
export const TAX_CATEGORY = "Impostos e Taxas";

type TaxInvoice = {
  value: number;
  status: string;
  paid_date: string | null;
};

type TaxCost = {
  id?: string;
  name?: string | null;
  category?: string | null;
  amount?: number;
  description?: string | null;
  is_auto_generated?: boolean;
  month?: string | null;
  status?: string | null;
};

export type AutomaticTaxRow = {
  id?: string;
  name: string;
  category: string;
  description: string;
  amount: number;
  month: string;
  status: "pending";
  is_auto_generated: true;
  organization_id?: string;
};

type BuildAutomaticTaxRowsInput = {
  invoices: TaxInvoice[];
  existingCosts: TaxCost[];
  taxRate: number;
  organizationId?: string;
};

function toTaxMonthKey(date: string) {
  return format(parseISO(date), "yyyy-MM");
}

function toDueDate(monthKey: string) {
  return `${monthKey}-20`;
}

function toDescription(monthKey: string) {
  const label = format(parseISO(`${monthKey}-01`), "MMM/yy", { locale: ptBR });
  return `AUTO_GERADO - Imposto sobre recebimentos confirmados (${label[0].toUpperCase()}${label.slice(1)})`;
}

export function isAutomaticTaxCost(cost: TaxCost) {
  return Boolean(cost.is_auto_generated && cost.category === TAX_CATEGORY && cost.name === TAX_NAME);
}

export function buildAutomaticTaxRows({
  invoices,
  existingCosts,
  taxRate,
  organizationId,
}: BuildAutomaticTaxRowsInput): AutomaticTaxRow[] {
  const revenueByMonth = new Map<string, number>();

  invoices.forEach((invoice) => {
    const isConfirmed = invoice.status === "paid" || invoice.status === "pago";
    if (!isConfirmed || !invoice.paid_date) return;

    const monthKey = toTaxMonthKey(invoice.paid_date);
    revenueByMonth.set(monthKey, (revenueByMonth.get(monthKey) || 0) + Number(invoice.value || 0));
  });

  return Array.from(revenueByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([monthKey, revenue]) => {
      const existing = existingCosts.find((cost) => {
        if (!isAutomaticTaxCost(cost) || !cost.month) return false;
        return toTaxMonthKey(cost.month) === monthKey;
      });

      const row = {
        ...(existing?.id ? { id: existing.id } : {}),
        ...(organizationId ? { organization_id: organizationId } : {}),
        name: TAX_NAME,
        category: TAX_CATEGORY,
        description: toDescription(monthKey),
        amount: Number((revenue * taxRate).toFixed(2)),
        month: toDueDate(monthKey),
        status: "pending",
        is_auto_generated: true,
      };

      const isUnchanged = existing
        && Number(existing.amount || 0) === row.amount
        && existing.month === row.month
        && existing.name === row.name
        && existing.category === row.category
        && existing.description === row.description
        && existing.status === row.status;

      return isUnchanged ? [] : [row];
    });
}
