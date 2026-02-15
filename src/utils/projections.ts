
import { Client } from "@/hooks/useClients";
import { startOfMonth, endOfMonth, parseISO, isBefore, isAfter, isSameMonth, addMonths } from "date-fns";

/**
 * Calculates the projected revenue (MRR sum) for a specific target month
 * based on the active clients and their contracts.
 * 
 * Rules:
 * - Client must have started before or during the target month.
 * - Client must not have churned before the target month.
 * - Contract must not have ended before the target month (unless auto-renewal or monthly w/o duration).
 *   (For now, we strictly respect contract duration).
 */
export function calculateProjectedRevenue(clients: Client[], targetMonth: Date): number {
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);

    return clients.reduce((total, client) => {
        // 1. Start Date Check
        // If no start_date, assume created_at. If neither, skip.
        if (!client.start_date && !client.created_at) return total;

        const startDate = parseISO(client.start_date || client.created_at);
        // If client starts AFTER this month, they contribute 0.
        if (isAfter(startOfMonth(startDate), monthEnd)) return total;

        // 2. Churn Check
        if (client.status === 'churned' && client.churn_date) {
            const churnDate = parseISO(client.churn_date);
            // If churned BEFORE this month starts, they contribute 0.
            // (Assuming churn date is the last active day or similar). 
            // If churn date is IN this month, do we count? Usually yes, prorated or full?
            // "fim do contrato no mês pedido o cancelamento" suggests partial or full up to that month.
            // Let's assume if churnDate < monthStart, they are out.
            if (isBefore(churnDate, monthStart)) return total;
        }

        // 3. Contract Duration Check
        // If billing_cycle is 'monthly' and NO duration (or small), we treat as "Ongoing" or "1 month" based on previous logic?
        // User said: "se mensal sem contrato anual, informar 1 mês" for visual alert.
        // For PROJECTION, a monthly client without end date is usually infinite/recurring until churn.
        // But if they have a set duration (e.g. 12 months), we should respect it.

        let endDate: Date | null = null;

        if (client.contract_duration && client.contract_duration > 0) {
            endDate = addMonths(startDate, client.contract_duration);
        } else if (client.billing_cycle === 'monthly' && (!client.contract_duration || client.contract_duration < 12)) {
            // "Monthly No Contract" - effectively infinite or until 1 month?
            // For projection, we assume they continue paying until updated/churned.
            // Setting endDate to null implies infinite.
            endDate = null;
        } else {
            // Default fallback: 12 months if nothing specified? Or infinite?
            // Let's assume 12 months default for safety if unsure.
            endDate = addMonths(startDate, 12);
        }

        // If finite end date exists and is BEFORE this month, they contribute 0.
        if (endDate && isBefore(endDate, monthStart)) {
            return total;
        }

        // If we are here, the client is active in this month.
        return total + Number(client.mrr || 0);
    }, 0);
}
