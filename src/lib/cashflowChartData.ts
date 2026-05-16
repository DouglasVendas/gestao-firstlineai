import {
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export interface CashflowChartItem {
  amount: number;
  type: "entrada" | "saida";
  date: string;
  category?: string | null;
}

export interface CashflowChartDateRange {
  from?: Date;
  to?: Date;
}

export interface CashflowChartPoint {
  month: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

function toItemDate(value: string) {
  return parseISO(value.substring(0, 10));
}

export function buildCashflowChartData(
  items: CashflowChartItem[],
  selectedMonth: Date,
  dateRange?: CashflowChartDateRange,
): CashflowChartPoint[] {
  const periodStart = startOfDay(dateRange?.from ?? startOfMonth(selectedMonth));
  const periodEnd = endOfDay(dateRange?.to ?? dateRange?.from ?? endOfMonth(selectedMonth));
  const months = eachMonthOfInterval({
    start: startOfMonth(periodStart),
    end: startOfMonth(periodEnd),
  });

  return months.map((month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const visibleStart = monthStart < periodStart ? periodStart : monthStart;
    const visibleEnd = monthEnd > periodEnd ? periodEnd : monthEnd;

    let entradas = 0;
    let saidas = 0;
    let saldo = 0;

    items.forEach((item) => {
      if (!item.date) return;
      const itemDate = toItemDate(item.date);
      const signedAmount = item.type === "entrada" ? Number(item.amount || 0) : -Number(item.amount || 0);

      if (itemDate <= monthEnd) {
        saldo += signedAmount;
      }

      if (!isWithinInterval(itemDate, { start: visibleStart, end: visibleEnd })) return;

      const isInvestment = (item.category || "").toLowerCase().includes("investimento");
      if (item.type === "entrada") {
        if (!isInvestment) entradas += Number(item.amount || 0);
      } else {
        saidas += Number(item.amount || 0);
      }
    });

    return {
      month: format(month, "MMM/yy", { locale: ptBR }),
      entradas,
      saidas,
      saldo,
    };
  });
}
