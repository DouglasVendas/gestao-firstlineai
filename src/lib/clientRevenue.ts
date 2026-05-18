import { addMonths, differenceInCalendarMonths, isBefore, max as maxDate, startOfDay } from "date-fns";
import { Client, getEffectiveMRR } from "@/hooks/useClients";

const DEFAULT_RECURRING_PROJECTION_MONTHS = 12;

export function getProjectedRevenueMonths(client: Client, referenceDate = new Date()) {
  if (client.status === "churned") return 0;

  const startDate = startOfDay(new Date(client.start_date || client.created_at));
  const projectionStart = maxDate([startOfDay(referenceDate), startDate]);
  const isRecurringMonthly = !client.billing_cycle || client.billing_cycle === "monthly";

  if (isRecurringMonthly) {
    return DEFAULT_RECURRING_PROJECTION_MONTHS;
  }

  const contractDuration = client.contract_duration || DEFAULT_RECURRING_PROJECTION_MONTHS;
  const contractEnd = addMonths(startDate, contractDuration);

  if (isBefore(contractEnd, projectionStart)) return 0;

  return Math.max(0, differenceInCalendarMonths(contractEnd, projectionStart));
}

export function calculateClientProjectedRevenue(client: Client, referenceDate = new Date()) {
  return getEffectiveMRR(client) * getProjectedRevenueMonths(client, referenceDate);
}

export function calculateProjectedClientsRevenue(clients: Client[], referenceDate = new Date()) {
  return clients.reduce((total, client) => total + calculateClientProjectedRevenue(client, referenceDate), 0);
}
