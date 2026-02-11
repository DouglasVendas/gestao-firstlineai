import { useMemo } from "react";
import { useFinancialData } from "@/contexts/FinancialContext";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, isSameMonth, subMonths, startOfDay, endOfDay, eachMonthOfInterval, min as minDate, max as maxDate, format } from "date-fns";

export interface DashboardMetrics {
    activeClients: number;
    churnRate: number;
    mrr: number;
    arr: number;
    revenue: number;
    totalExpenses: number;
    netResult: number;
    ltv: number;
    cac: number;
    month: string; // YYYY-MM
    ratio: number;
    paybackTerm: number;
}

function calculateMetricsForMonth(
    date: Date,
    data: { clients: any[], invoices: any[], fixedCosts: any[], variableCosts: any[] }
): DashboardMetrics {
    const { clients, invoices, fixedCosts, variableCosts } = data;
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    // 1. ACTIVE CLIENTS
    const activeClients = clients.filter(c => {
        const startDate = c.start_date ? parseISO(c.start_date) : parseISO(c.created_at);
        // Churn logic: active if churn_date is NULL or > monthEnd
        // If churn_date is exactly in this month, they are churned AT THE END of the month? 
        // Usually: active during the month, churn event counts for this month's churn rate.
        // Dashboard "Active Clients" usually means "Active at the end of the period".
        // So if churn_date <= monthEnd, they are NOT active.
        const churnDate = c.churn_date ? parseISO(c.churn_date) : null;

        // Must have started before or during this month
        const started = startDate <= monthEnd;
        // Must NOT have churned before this month ended (i.e. churn > monthEnd or null)
        const notChurned = !churnDate || churnDate > monthEnd;

        return started && notChurned;
    });

    const activeClientsCount = activeClients.length;

    // 2. CHURN RATE
    // Churned in this exact month
    const churnedInMonthCount = clients.filter(c => {
        if (!c.churn_date) return false;
        const churnDate = parseISO(c.churn_date);
        return isSameMonth(churnDate, date);
    }).length;

    // Active at START of month = Active End + Churned In - New In
    // Precise calculation:
    const activeAtStart = clients.filter(c => {
        const startDate = c.start_date ? parseISO(c.start_date) : parseISO(c.created_at);
        const churnDate = c.churn_date ? parseISO(c.churn_date) : null;
        // Active at monthStart moment
        return startDate < monthStart && (!churnDate || churnDate >= monthStart);
    }).length;

    const churnRate = activeAtStart > 0 ? (churnedInMonthCount / activeAtStart) * 100 : 0;

    // 3. MRR & ARR
    const mrr = activeClients.reduce((sum, client) => sum + (Number(client.mrr) || 0), 0);
    const arr = mrr * 12;

    // 4. REVENUE (CASH BASIS)
    // Sum of invoices PAID in this month
    const revenue = invoices
        .filter(inv => {
            if (inv.status !== 'paid' && inv.status !== 'pago') return false;
            const paidDate = inv.paid_date ? parseISO(inv.paid_date) : null;
            // Fallback to due_date or created_at if necessary, but prioritize paid_date
            const dateToUse = paidDate || parseISO(inv.due_date);
            return isSameMonth(dateToUse, date);
        })
        .reduce((sum, inv) => sum + Number(inv.value), 0);

    // 5. EXPENSES
    const totalFixedCosts = fixedCosts
        .filter(c => c.month && isSameMonth(parseISO(c.month), date))
        .reduce((sum, c) => sum + Number(c.actual), 0);

    const totalVariableCosts = variableCosts
        .filter(c => c.month && isSameMonth(parseISO(c.month), date))
        .reduce((sum, c) => sum + Number(c.amount), 0);

    const totalExpenses = totalFixedCosts + totalVariableCosts;

    // 6. NET RESULT
    const netResult = revenue - totalExpenses;

    // 7. LTV (Simple: ARPU / Churn Rate)
    const arpu = activeClientsCount > 0 ? mrr / activeClientsCount : 0;
    // Handle 0 churn rate - maybe cap it or use 1% proxy
    const safeChurnRate = churnRate === 0 ? 0 : churnRate / 100;
    const ltv = safeChurnRate > 0 ? arpu / safeChurnRate : 0;

    // 8. CAC (Marketing Spend / New Clients)
    // Need marketing spend. Assuming it's in Variable Costs with specific categories.
    const marketingSpend = variableCosts
        .filter(c => {
            if (!c.month || !isSameMonth(parseISO(c.month), date)) return false;
            const cat = c.category.toLowerCase();
            return cat.includes('marketing') || cat.includes('anúncio') || cat.includes('ads');
        })
        .reduce((sum, c) => sum + Number(c.amount), 0);

    const newClientsCount = clients.filter(c => {
        const startDate = c.start_date ? parseISO(c.start_date) : parseISO(c.created_at);
        return isSameMonth(startDate, date);
    }).length;

    const cac = newClientsCount > 0 ? marketingSpend / newClientsCount : 0;

    return {
        activeClients: activeClientsCount,
        churnRate,
        mrr,
        arr,
        revenue,
        totalExpenses,
        netResult,
        ltv,
        cac,
        ratio: cac > 0 ? Number((ltv / cac).toFixed(2)) : 0,
        paybackTerm: (cac > 0 && arpu > 0) ? cac / arpu : 0,
        month: format(date, 'yyyy-MM') // for charts
    };
}

export const useFinancialSnapshot = () => {
    const { clients, invoices, fixedCosts, variableCosts, selectedMonth, isLoading } = useFinancialData();
    const data = { clients, invoices, fixedCosts, variableCosts };

    const snapshot = useMemo(() => {
        if (isLoading) return null;

        const current = calculateMetricsForMonth(selectedMonth, data);
        const previous = calculateMetricsForMonth(subMonths(selectedMonth, 1), data);

        return { current, previous, isLoading: false };
    }, [clients, invoices, fixedCosts, variableCosts, selectedMonth, isLoading]);

    if (!snapshot) return { current: null, previous: null, isLoading: true };
    return snapshot;
};

export const useFinancialHistory = () => {
    const { clients, invoices, fixedCosts, variableCosts, isLoading, selectedMonth } = useFinancialData();
    const data = { clients, invoices, fixedCosts, variableCosts };

    // Generate history for last 12 months ending in selectedMonth OR all time?
    // Dashboard charts usually show a fixed window (e.g. 12 months).
    // Let's do 12 months including selectedMonth.

    const history = useMemo(() => {
        if (isLoading) return [];

        // Range: 11 months ago to selectedMonth
        const end = selectedMonth;
        const start = subMonths(selectedMonth, 11);

        try {
            const months = eachMonthOfInterval({ start, end });
            return months.map(date => calculateMetricsForMonth(date, data));
        } catch (e) {
            console.error("Error generating history interval", e);
            return [];
        }

    }, [clients, invoices, fixedCosts, variableCosts, selectedMonth, isLoading]);

    return history;
};

// Default export for backward compatibility if needed, but better to use named exports
export const useFinancialMetrics = useFinancialSnapshot;
