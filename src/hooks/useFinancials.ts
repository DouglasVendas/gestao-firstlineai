import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MonthlyFinancials {
    month: string; // YYYY-MM
    revenue: number; // Cash received (paid invoices)
    mrr: number; // Contracted MRR (active clients)
    arr: number; // mrr * 12
    expenses: number; // Fixed + Variable
    active_clients: number;
    churn_rate: number; // Calculated
    cac?: number;
    leads?: number;
    visitors?: number;
}

export const useFinancials = () => {
    return useQuery({
        queryKey: ["financials_dynamic"],
        queryFn: async () => {
            // 1. Fetch all raw data
            const { data: clients, error: clientsError } = await supabase
                .from("clients")
                .select("*");
            if (clientsError) throw clientsError;

            const { data: invoices, error: invoicesError } = await supabase
                .from("invoices")
                .select("*");
            if (invoicesError) throw invoicesError;

            const { data: fixedCosts, error: fixedCostsError } = await supabase
                .from("fixed_costs")
                .select("*");
            if (fixedCostsError) throw fixedCostsError;

            const { data: variableCosts, error: variableCostsError } = await supabase
                .from("variable_costs")
                .select("*");
            if (variableCostsError) throw variableCostsError;

            const { data: marketingStats, error: marketingStatsError } = await supabase
                .from("marketing_stats")
                .select("*");
            // Marketing stats might be empty initially, don't throw if just empty, but throw on error
            if (marketingStatsError) console.error("Error fetching marketing stats:", marketingStatsError);

            // 2. Determine Date Range (min date to today)
            // Find earliest date across all datasets
            const dates = [
                ...clients.map(c => c.start_date || c.created_at),
                ...invoices.map(i => i.due_date),
                ...fixedCosts.map(c => c.month ? `${c.month}-01` : null),
                ...variableCosts.map(c => c.month ? `${c.month}-01` : null)
            ].filter(Boolean) as string[];

            if (dates.length === 0) return [];

            dates.sort();
            const startDate = new Date(dates[0]);
            const endDate = new Date(); // Today

            const months: string[] = [];
            let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            const end = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);

            while (current <= end) {
                months.push(current.toISOString().substring(0, 7));
                current.setMonth(current.getMonth() + 1);
            }

            // 3. Aggregate Data per Month
            const financials: MonthlyFinancials[] = months.map(month => { // month = "YYYY-MM"
                const monthStart = new Date(`${month}-01`);
                const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

                // a. MRR & Active Clients (Access from logic in Metrics.tsx)
                // Active if: start_date <= monthEnd AND (churn_date IS NULL OR churn_date > monthEnd)
                let monthlyMrr = 0;
                let activeClientsCount = 0;
                let churnedClientsCount = 0;

                clients.forEach(c => {
                    const start = c.start_date ? new Date(c.start_date) : new Date(c.created_at);
                    const churn = c.churn_date ? new Date(c.churn_date) : null;

                    // Check if active in this month
                    if (start <= monthEnd && (!churn || churn > monthEnd)) {
                        monthlyMrr += c.mrr || 0;
                        activeClientsCount++;
                    }

                    // Check if churned in this specific month
                    if (churn && churn >= monthStart && churn <= monthEnd) {
                        churnedClientsCount++;
                    }
                });

                // b. Revenue (Cash Flow - Paid Invoices)
                // Sum invoices where status='paid' and due_date (or paid_date) is in this month
                // Using due_date for simplicity as import maps data->due_date
                const monthlyRevenue = invoices
                    .filter(i => {
                        const d = i.due_date.substring(0, 7);
                        return d === month && (i.status === 'paid' || i.status === 'pago');
                    })
                    .reduce((sum, i) => sum + i.value, 0);

                // c. Expenses
                const monthlyFixed = fixedCosts
                    .filter(c => c.month === month || (c.month && c.month.substring(0, 7) === month))
                    .reduce((sum, c) => sum + c.actual, 0);

                const monthlyVariable = variableCosts
                    .filter(c => c.month === month || (c.month && c.month.substring(0, 7) === month))
                    .reduce((sum, c) => sum + c.amount, 0);

                // d. Churn Rate
                // Logic: Churned Clients / Start of Month Clients (approx active + churned?)
                // Simple: churned / (active + churned)
                // Or if activeClientsCount is "at end of month", then start was active + churned.
                const startOfMonthClients = activeClientsCount + churnedClientsCount;
                const churnRate = startOfMonthClients > 0 ? (churnedClientsCount / startOfMonthClients) * 100 : 0;

                // Match Marketing Stats
                const mStats = marketingStats?.find(m => m.month === month);

                // RECALCULATED CAC LOGIC:
                const marketingSpend = variableCosts
                    .filter(c => (c.month === month || (c.month && c.month.substring(0, 7) === month)) &&
                        (c.category === 'Marketing' || c.category === 'Anúncio Facebook' || c.category === 'Gestor de Tráfego'))
                    .reduce((sum, c) => sum + c.amount, 0);

                // New Clients Calculation (Change in active clients + churned? Or just count starts?)
                // Helper: Count clients with start_date in this month
                const newClientsCount = clients.filter(c => {
                    const start = c.start_date ? c.start_date.substring(0, 7) : c.created_at.substring(0, 7);
                    return start === month;
                }).length;

                const calculatedCac = newClientsCount > 0 ? marketingSpend / newClientsCount : 0;

                return {
                    month,
                    revenue: monthlyRevenue,
                    mrr: monthlyMrr,
                    arr: monthlyMrr * 12,
                    expenses: monthlyFixed + monthlyVariable,
                    active_clients: activeClientsCount,
                    churn_rate: churnRate,
                    cac: calculatedCac,
                    leads: mStats?.leads || 0,
                    visitors: mStats?.visitors || 0
                };
            });

            return financials;
        },
    });
};
