import {
  parseISO,
  startOfMonth,
  endOfMonth,
  differenceInMonths,
  getDaysInMonth,
  isAfter,
  format,
  eachMonthOfInterval,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from 'date-fns';
import type { Client } from '@/hooks/useClients';
import type { Invoice } from '@/hooks/useInvoices';
import type { DateRange } from 'react-day-picker';

export interface ComputedInvoice {
  id: string;
  client_id: string;
  client: { name: string };
  value: number;
  due_date: string;
  status: 'pending' | 'overdue';
  paid_date: null;
  is_computed: true;
  plan_name?: string;
  billing_cycle: string;
}

export type DisplayInvoice =
  | (Invoice & { is_computed: false })
  | ComputedInvoice;

const CYCLE_MONTHS: Record<string, number> = {
  monthly: 1,
  bimonthly: 2,
  quarterly: 3,
  semiannual: 6,
  yearly: 12,
};

export function computeExpectedInvoices(clients: Client[], month: Date): ComputedInvoice[] {
  const today = new Date();
  const monthEnd = endOfMonth(month);
  const monthStart = startOfMonth(month);

  return clients.flatMap((client): ComputedInvoice[] => {
    if (!client.start_date) return [];
    if (client.status === 'churned') return [];

    const startDate = parseISO(client.start_date);
    if (startDate > monthEnd) return [];

    const cycleDuration = CYCLE_MONTHS[client.billing_cycle || 'monthly'];
    const monthsSinceStart = differenceInMonths(monthStart, startOfMonth(startDate));

    if (monthsSinceStart < 0) return [];
    if (monthsSinceStart % cycleDuration !== 0) return [];

    // billing_day = dia do start_date (automático)
    const billingDay = startDate.getDate();
    const dueDay = Math.min(billingDay, getDaysInMonth(month));
    const dueDate = new Date(month.getFullYear(), month.getMonth(), dueDay);

    if (client.churn_date && parseISO(client.churn_date) < dueDate) return [];

    const status = isAfter(today, dueDate) ? 'overdue' : 'pending';

    // Invoice value = MRR (monthly) × cycle duration, so yearly clients get billed R$24k not R$2k
    const invoiceValue = client.mrr * cycleDuration;

    return [{
      id: `computed-${client.id}-${format(month, 'yyyy-MM')}`,
      client_id: client.id,
      client: { name: client.name },
      value: invoiceValue,
      due_date: dueDate.toISOString(),
      status,
      paid_date: null,
      is_computed: true,
      plan_name: client.plan?.name,
      billing_cycle: client.billing_cycle || 'monthly',
    }];
  });
}

export function mergeInvoices(
  realInvoices: Invoice[],
  clients: Client[],
  month: Date
): DisplayInvoice[] {
  const realThisMonth = realInvoices.filter(
    inv => inv.due_date && isSameMonth(parseISO(inv.due_date), month)
  );

  const expected = computeExpectedInvoices(clients, month);

  // Clientes que já têm fatura real este mês não precisam de fatura computada
  const realClientIds = new Set(realThisMonth.map(inv => inv.client_id));
  const computedNotInDB = expected.filter(c => !realClientIds.has(c.client_id));

  return [
    ...realThisMonth.map(inv => ({ ...inv, is_computed: false as const })),
    ...computedNotInDB,
  ].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
}

export function mergeInvoicesInRange(
  realInvoices: Invoice[],
  clients: Client[],
  range: DateRange | undefined,
  fallbackMonth: Date
): DisplayInvoice[] {
  if (!range?.from) {
    return mergeInvoices(realInvoices, clients, fallbackMonth);
  }

  const interval = {
    start: startOfDay(range.from),
    end: endOfDay(range.to ?? range.from),
  };

  const realInRange = realInvoices.filter((inv) => {
    if (!inv.due_date) return false;
    return isWithinInterval(parseISO(inv.due_date), interval);
  });

  const months = eachMonthOfInterval({
    start: startOfMonth(interval.start),
    end: startOfMonth(interval.end),
  });

  const realClientMonthKeys = new Set(
    realInvoices
      .filter((inv) => inv.client_id && inv.due_date)
      .map((inv) => `${inv.client_id}-${format(parseISO(inv.due_date), 'yyyy-MM')}`)
  );

  const computedInRange = months
    .flatMap((month) => computeExpectedInvoices(clients, month))
    .filter((invoice) => {
      const dueDate = parseISO(invoice.due_date);
      const key = `${invoice.client_id}-${format(dueDate, 'yyyy-MM')}`;
      return isWithinInterval(dueDate, interval) && !realClientMonthKeys.has(key);
    });

  return [
    ...realInRange.map(inv => ({ ...inv, is_computed: false as const })),
    ...computedInRange,
  ].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
}

function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth();
}
