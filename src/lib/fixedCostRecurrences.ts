import { addMonths, format, isAfter, isBefore, lastDayOfMonth, parseISO, startOfDay, startOfMonth } from "date-fns";
import { CostAttachment } from "@/hooks/useCostAttachments";

export type FixedCostRecurringStatus = "active" | "paused" | "ended";
export type FixedCostPaymentStatus = "pending" | "paid" | "overdue" | "canceled";

export interface RecurringFixedCost {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: string;
  amount: number;
  active: boolean | null;
  due_date_day: number;
  start_date: string;
  end_date: string | null;
  duration_months?: number | null;
  status?: FixedCostRecurringStatus | null;
  created_at: string;
}

export interface FixedCostPayment {
  id: string;
  recurring_fixed_cost_id: string;
  organization_id: string;
  reference_month: string;
  due_date: string;
  amount: number;
  status: FixedCostPaymentStatus;
  paid_at: string | null;
  notes: string | null;
  cash_account_id?: string | null;
  created_at: string;
  attachments?: CostAttachment[];
}

export interface FixedCostOccurrence {
  id: string;
  recurring_id: string;
  payment_id: string | null;
  organization_id: string;
  name: string;
  category: string;
  description: string | null;
  actual: number;
  budgeted: number | null;
  status: FixedCostPaymentStatus;
  due_day: number;
  due_date: string;
  month: string;
  start_date: string;
  end_date: string | null;
  duration_months?: number | null;
  created_at: string;
  attachments?: CostAttachment[];
  payment?: FixedCostPayment | null;
  recurring: RecurringFixedCost;
}

function toMonthStartString(date: Date) {
  return format(startOfMonth(date), "yyyy-MM-dd");
}

function clampDueDate(month: Date, dueDay: number) {
  const start = startOfMonth(month);
  const lastDay = lastDayOfMonth(start).getDate();
  const day = Math.min(Math.max(dueDay, 1), lastDay);
  return format(new Date(start.getFullYear(), start.getMonth(), day), "yyyy-MM-dd");
}

export function getRecurringEndMonth(startDate: string, durationMonths?: number | null) {
  if (!durationMonths || durationMonths <= 0) return null;
  return toMonthStartString(addMonths(parseISO(startDate), durationMonths - 1));
}

function isRecurringActiveInMonth(recurring: RecurringFixedCost, selectedMonth: Date) {
  const monthStart = startOfMonth(selectedMonth);
  const startDate = startOfMonth(parseISO(recurring.start_date));
  const explicitEnd = recurring.end_date ? startOfMonth(parseISO(recurring.end_date)) : null;
  const durationEnd = recurring.duration_months ? parseISO(getRecurringEndMonth(recurring.start_date, recurring.duration_months)!) : null;
  const endDate = explicitEnd && durationEnd
    ? (isBefore(explicitEnd, durationEnd) ? explicitEnd : durationEnd)
    : explicitEnd || durationEnd;

  if (recurring.status === "paused" || recurring.status === "ended" || recurring.active === false) return false;
  if (isBefore(monthStart, startDate)) return false;
  if (endDate && isAfter(monthStart, endDate)) return false;
  return true;
}

function inferPaymentStatus(payment: FixedCostPayment | undefined, dueDate: string, today: Date): FixedCostPaymentStatus {
  if (payment?.status === "paid" || payment?.status === "canceled") return payment.status;
  if (isBefore(parseISO(dueDate), startOfDay(today))) return "overdue";
  return payment?.status || "pending";
}

export function buildFixedCostOccurrence({
  recurring,
  selectedMonth,
  payment,
  today = new Date(),
}: {
  recurring: RecurringFixedCost;
  selectedMonth: Date;
  payment?: FixedCostPayment;
  today?: Date;
}): FixedCostOccurrence | null {
  if (!isRecurringActiveInMonth(recurring, selectedMonth)) return null;

  const month = toMonthStartString(selectedMonth);
  const dueDate = payment?.due_date || clampDueDate(selectedMonth, recurring.due_date_day);
  const status = inferPaymentStatus(payment, dueDate, today);

  return {
    id: payment?.id || `${recurring.id}:${month}`,
    recurring_id: recurring.id,
    payment_id: payment?.id || null,
    organization_id: recurring.organization_id,
    name: recurring.name,
    category: recurring.category,
    description: recurring.description,
    actual: Number(payment?.amount ?? recurring.amount),
    budgeted: null,
    status,
    due_day: recurring.due_date_day,
    due_date: dueDate,
    month,
    start_date: recurring.start_date,
    end_date: recurring.end_date,
    duration_months: recurring.duration_months,
    created_at: payment?.created_at || recurring.created_at,
    attachments: payment?.attachments || [],
    payment: payment || null,
    recurring,
  };
}
