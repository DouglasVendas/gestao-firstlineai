import { useMemo } from "react";
import { useFinancialData } from "@/contexts/FinancialContext";
import { startOfMonth, endOfMonth, isSameMonth, subMonths, startOfDay, eachMonthOfInterval, format, parseISO, addMonths } from "date-fns";
import { FinancialSettings } from "./useFinancialSettings";
import { getEffectiveMRR } from "./useClients";
import { calculateTotalCashBalance } from "@/lib/cashAccounts";
import { useCashSummary } from "@/hooks/useCashAccounts";

export interface DashboardMetrics {
    activeClients: number;
    churnRate: number;
    mrr: number;
    arr: number;
    revenue: number;
    totalExpenses: number;
    netResult: number;
    netMargin: number;
    ltv: number;
    cac: number;
    month: string; // YYYY-MM
    ratio: number;
    paybackTerm: number;
    newMRR: number;
    churnMRR: number;
    expansionMRR: number;
    contractionMRR: number;
    quickRatio: number;
    ruleOf40: number;
    nps: number;
    riskClients: number;
    runway: number; // Months of runway. If negative/zero/infinite, handle in UI.
    cashBalance: number;
}

function calculateMetricsForMonth(
    date: Date,
    data: { clients: any[], invoices: any[], fixedCosts: any[], variableCosts: any[], mrrChanges: any[] },
    settings?: FinancialSettings
): DashboardMetrics {
    const { clients, invoices, fixedCosts, variableCosts, mrrChanges } = data;
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    // 1. ACTIVE CLIENTS (At end of month)
    const activeClients = clients.filter(c => {
        const startDate = c.start_date ? parseISO(c.start_date) : parseISO(c.created_at);
        const churnDate = c.churn_date ? parseISO(c.churn_date) : null;

        const started = startDate <= monthEnd;
        const notChurned = !churnDate || churnDate > monthEnd;

        return started && notChurned;
    });

    const activeClientsCount = activeClients.length;

    // 2. CHURN RATE
    const activeAtStart = clients.filter(c => {
        const startDate = c.start_date ? parseISO(c.start_date) : parseISO(c.created_at);
        const churnDate = c.churn_date ? parseISO(c.churn_date) : null;
        return startDate < monthStart && (!churnDate || churnDate >= monthStart);
    }).length;

    const churnedInMonth = clients.filter(c => {
        if (!c.churn_date) return false;
        const churnDate = parseISO(c.churn_date);
        return isSameMonth(churnDate, date);
    });

    const churnedInMonthCount = churnedInMonth.length;
    const churnRate = activeAtStart > 0 ? (churnedInMonthCount / activeAtStart) * 100 : 0;

    // 3. MRR & ARR (P2 & P3 Fix)
    const mrr = activeClients.reduce((sum, client) => sum + getEffectiveMRR(client), 0);
    const arr = activeClients.reduce((sum, client) => sum + (getEffectiveMRR(client) * 12), 0);

    // 4. REVENUE (DYNAMIC BASIS)
    const accountingMethod = settings?.accounting_method || 'cash';

    const revenue = invoices
        .filter(inv => {
            if (accountingMethod === 'cash') {
                if (inv.status !== 'paid' && inv.status !== 'pago') return false;
                const paidDate = inv.paid_date ? parseISO(inv.paid_date) : null;
                const dateToUse = paidDate || parseISO(inv.due_date);
                return isSameMonth(dateToUse, date);
            } else {
                // Accrual Basis (Competência) - Use due_date
                const dueDate = parseISO(inv.due_date);
                return isSameMonth(dueDate, date) && inv.status !== 'canceled';
            }
        })
        .reduce((sum, inv) => sum + Number(inv.value), 0);

    // 5. EXPENSES
    const totalFixedCosts = fixedCosts
        .filter(c => {
            if (!c.month) return false;
            const costDate = parseISO(c.month);
            if (accountingMethod === 'cash') {
                return isSameMonth(costDate, date) && (c.status === 'paid' || c.status === 'pago');
            }
            return isSameMonth(costDate, date) && c.status !== 'canceled';
        })
        .reduce((sum, c) => sum + Number(c.actual), 0);

    const totalVariableCosts = variableCosts
        .filter(c => {
            if (!c.month) return false;
            const costDate = parseISO(c.month);
            if (accountingMethod === 'cash') {
                return isSameMonth(costDate, date) && (c.status === 'paid' || c.status === 'pago');
            }
            return isSameMonth(costDate, date) && c.status !== 'canceled';
        })
        .reduce((sum, c) => sum + Number(c.amount), 0);

    const totalExpenses = totalFixedCosts + totalVariableCosts;

    // 6. NET RESULT & MARGIN
    const netResult = revenue - totalExpenses;
    const netMargin = revenue > 0 ? (netResult / revenue) * 100 : 0;

    // 7. MRR MOVEMENTS (P1 Fix)
    const newClients = clients.filter(c => {
        const startDate = c.start_date ? parseISO(c.start_date) : parseISO(c.created_at);
        return isSameMonth(startDate, date);
    });

    const newMRR = newClients.reduce((sum, client) => sum + getEffectiveMRR(client), 0);

    const churnMRR = churnedInMonth.reduce((sum, client) => sum + getEffectiveMRR(client), 0);

    // Dynamic Expansion/Contraction from mrr_changes (P1)
    const expansionMRR = mrrChanges
        .filter(c => c.change_type === 'expansion' && isSameMonth(parseISO(c.change_date), date))
        .reduce((sum, c) => sum + (Number(c.new_mrr) - Number(c.previous_mrr)), 0);

    const contractionMRR = mrrChanges
        .filter(c => c.change_type === 'contraction' && isSameMonth(parseISO(c.change_date), date))
        .reduce((sum, c) => sum + (Number(c.previous_mrr) - Number(c.new_mrr)), 0);

    // 8. UNIT ECONOMICS (P7 Fix)
    const arpu = activeClientsCount > 0 ? mrr / activeClientsCount : 0;

    // Gross Margin calculation
    const grossMargin = revenue > 0 ? (revenue - totalVariableCosts) / revenue : 0.7;

    // LTV with margin. Cap at 36 months if churn is 0
    const ltv = churnRate > 0
        ? (arpu * grossMargin) / (churnRate / 100)
        : arpu * grossMargin * 36;

    // Correct CAC (P7): Include broader variable and fixed acquisition costs
    const cacCategories = settings?.cac_categories || ['marketing', 'anúncio', 'ads', 'google', 'facebook', 'vendas', 'comercial'];

    const acquisitionVariableSpend = variableCosts
        .filter(c => {
            if (!c.month || !isSameMonth(parseISO(c.month), date)) return false;
            const cat = c.category?.toLowerCase() || '';
            return cacCategories.some(k => cat.includes(k));
        })
        .reduce((sum, c) => sum + Number(c.amount), 0);

    const acquisitionFixedSpend = fixedCosts
        .filter(c => {
            if (!c.month || !isSameMonth(parseISO(c.month), date)) return false;
            const cat = c.category?.toLowerCase() || '';
            return cat.includes('comercial') || cat.includes('vendas');
        })
        .reduce((sum, c) => sum + Number(c.actual), 0);

    const totalAcquisitionCost = acquisitionVariableSpend + acquisitionFixedSpend;
    const newClientsCount = newClients.length;
    const cac = newClientsCount > 0 ? totalAcquisitionCost / newClientsCount : 0;

    const ratio = cac > 0 ? Number((ltv / cac).toFixed(2)) : 0;

    // Payback considering margin
    const paybackTerm = (cac > 0 && arpu > 0 && grossMargin > 0)
        ? cac / (arpu * grossMargin)
        : 0;

    // 9. QUICK STATS
    // Quick Ratio = (New MRR + Expansion) / (Churn MRR + Contraction)
    const losses = churnMRR + contractionMRR;
    const quickRatio = losses > 0 ? (newMRR + expansionMRR) / losses : (newMRR > 0 ? 100 : 0);

    // Rule of 40 = Growth Rate + Profit Margin
    // placeholder here, actual calculation in hook
    const ruleOf40 = 0;

    const nps = 0;

    const riskClients = new Set(
        invoices
            .filter(inv => {
                const dueDate = parseISO(inv.due_date);
                const isOverdue = dueDate < date && (inv.status === 'pending' || inv.status === 'overdue' || inv.status === 'atrasada');
                return isOverdue && inv.client_id;
            })
            .map(inv => inv.client_id)
    ).size;

    // 10. RUNWAY & CASH BALANCE
    const initialCashBalance = settings?.initial_balance || 0;
    const referenceDateStr = settings?.balance_reference_date || '2026-03-01';
    const balanceRefDate = parseISO(referenceDateStr);
    const billingRefDate = startOfDay(balanceRefDate);

    // We only consider transactions that happened AFTER the reference date AND BEFORE (or ON) the selected month end.
    // Actually, for "Current Balance" in the Dashboard, usually users want "Today's Balance".
    // But this function returns metrics "For Month X".
    // If Month X is Future, it's a projection.
    // If Month X is Past, it's history.
    // If Month X is Current, it's current running balance.

    // Let's check which transactions fall into the [ReferenceDate, MonthEnd] interval.

    // 10a. Revenue Delta
    const revenueDelta = invoices
        .filter(inv => {
            if (inv.status !== 'paid' && inv.status !== 'pago') return false;
            const paidDate = inv.paid_date ? parseISO(inv.paid_date) : null;
            if (!paidDate) return false;

            // Should be > Reference Date AND <= MonthEnd
            return paidDate > billingRefDate && paidDate <= monthEnd;
        })
        .reduce((sum, inv) => sum + Number(inv.value), 0);

    // 10b. Expense Delta
    // Fixed/Variable costs are usually monthly.
    // If cost month > reference month AND <= selected month

    // Normalize reference stats to month start for easier comparison
    const refMonthStart = startOfMonth(balanceRefDate);

    // 10b. Expense Delta
    const expenseDeltaFixed = fixedCosts
        .filter(c => {
            if (!c.month) return false;
            const cDate = parseISO(c.month);
            // Range check: (Start of Ref Month, End of Selected Month]
            return cDate > refMonthStart && cDate <= monthEnd;
        })
        .reduce((sum, c) => {
            const cDate = parseISO(c.month!);
            // STRICT PAYMENT CHECK:
            const isPaid = c.status === 'paid' || c.status === 'pago';

            if (!isPaid) {
                return sum; // Ignore pending costs for Current Balance
            }

            const isSoonerThanRef = cDate <= balanceRefDate;
            if (isSoonerThanRef) {
                return sum; // Already accounted for in initial balance
            }

            // Subtract Paid & Future (relative to RefDate)
            return sum + Number(c.actual);
        }, 0);

    const expenseDeltaVariable = variableCosts
        .filter(c => {
            if (!c.month) return false;
            const cDate = parseISO(c.month); // or c.date if available
            return cDate > refMonthStart && cDate <= monthEnd;
        })
        .reduce((sum, c) => {
            const cDate = parseISO(c.month!);
            // Variable Costs: Strict Paid Check
            const isPaid = (c as any).status === 'paid' || (c as any).status === 'pago';

            if (!isPaid) {
                return sum;
            }

            if (cDate <= balanceRefDate) return sum;

            return sum + Number(c.amount);
        }, 0);

    const totalExpenseDelta = expenseDeltaFixed + expenseDeltaVariable;

    let cashBalance = initialCashBalance + revenueDelta - totalExpenseDelta;

    // Burn Rate & Runway logic based on Net Margin (simplified)
    let runway = 0;
    if (netResult < 0) {
        const burnRate = Math.abs(netResult);
        runway = burnRate > 0 ? cashBalance / burnRate : 0;
    } else {
        runway = Infinity;
    }

    return {
        activeClients: activeClientsCount,
        churnRate,
        mrr,
        arr,
        revenue,
        totalExpenses,
        netResult,
        netMargin,
        ltv,
        cac,
        ratio,
        paybackTerm,
        month: format(date, 'yyyy-MM'),
        newMRR,
        churnMRR,
        expansionMRR,
        contractionMRR,
        quickRatio,
        ruleOf40,
        nps,
        riskClients,
        runway,
        cashBalance
    };
}

export const useFinancialSnapshot = () => {
    const { clients, invoices, fixedCosts, variableCosts, mrrChanges, selectedMonth, settings, isLoading } = useFinancialData();
    const { accounts, movements, isLoading: isLoadingCash } = useCashSummary();
    const data = { clients, invoices, fixedCosts, variableCosts, mrrChanges };

    const snapshot = useMemo(() => {
        if (isLoading || isLoadingCash) return null;

        const current = calculateMetricsForMonth(selectedMonth, data, settings);
        const previous = calculateMetricsForMonth(subMonths(selectedMonth, 1), data, settings);
        if (accounts.length > 0) {
            current.cashBalance = calculateTotalCashBalance(accounts, movements);
        }

        // Calculate Rule of 40
        // Growth Rate = (Current MRR - Previous MRR) / Previous MRR * 100
        const previousMRR = previous.mrr || 0;
        const growthRate = previousMRR > 0 ? ((current.mrr - previousMRR) / previousMRR) * 100 : 0;

        current.ruleOf40 = growthRate + current.netMargin;

        return { current, previous, isLoading: false };
    }, [clients, invoices, fixedCosts, variableCosts, selectedMonth, isLoading, isLoadingCash, settings, accounts, movements]);

    if (!snapshot) return { current: null, previous: null, isLoading: true };
    return snapshot;
};

export const useFinancialHistory = () => {
    const { clients, invoices, fixedCosts, variableCosts, mrrChanges, isLoading, selectedMonth, settings } = useFinancialData();
    const data = { clients, invoices, fixedCosts, variableCosts, mrrChanges };

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
            return months.map(date => calculateMetricsForMonth(date, data, settings));
        } catch (e) {
            console.error("Error generating history interval", e);
            return [];
        }

    }, [clients, invoices, fixedCosts, variableCosts, selectedMonth, isLoading, settings]);

    return history;
};

// Default export for backward compatibility if needed, but better to use named exports
export const useFinancialMetrics = useFinancialSnapshot;
