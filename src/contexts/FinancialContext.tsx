import { createContext, useContext, ReactNode, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/hooks/useClients";
import { Invoice } from "@/hooks/useInvoices";
import { FixedCost } from "@/hooks/useFixedCosts";
import { VariableCost } from "@/hooks/useVariableCosts";
import { Transaction } from "@/hooks/useTransactions";
import { financialConfig } from "@/config/financialConfig";
import { eachMonthOfInterval, format, isSameMonth, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";

interface FinancialContextType {
    clients: Client[];
    invoices: Invoice[];
    fixedCosts: FixedCost[];
    variableCosts: VariableCost[];
    transactions: Transaction[];
    isLoading: boolean;
    selectedMonth: Date;
    setSelectedMonth: (date: Date) => void;
    dateRange: DateRange | undefined;
    setDateRange: (range: DateRange | undefined) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: ReactNode }) {
    const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
    });
    const queryClient = useQueryClient();

    const { data: clients, isLoading: loadingClients } = useQuery({
        queryKey: ["clients"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("clients")
                .select("*, plan:plans(name)")
                .order("name");
            if (error) throw error;
            return data as unknown as Client[];
        },
    });

    const { data: invoices, isLoading: loadingInvoices } = useQuery({
        queryKey: ["invoices"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("invoices")
                .select("*, client:clients(name)")
                .order("due_date");
            if (error) throw error;
            return data as unknown as Invoice[];
        },
    });

    const { data: fixedCosts, isLoading: loadingFixed } = useQuery({
        queryKey: ["fixed_costs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("fixed_costs")
                .select("*")
                .order("category");
            if (error) throw error;
            return data as unknown as FixedCost[];
        },
    });

    // ... (other queries)

    // MERGE MANUAL COSTS
    // We generate virtual fixed costs for 2026 (or a dynamic range around today)
    const virtualFixedCosts = useMemo(() => {
        const generated: FixedCost[] = [];
        const start = new Date(2026, 0, 1); // Jan 2026
        const end = new Date(2026, 11, 31); // Dec 2026
        // You could extend this range if needed.

        const months = eachMonthOfInterval({ start, end });
        const { manualFixedCosts } = financialConfig;

        months.forEach(date => {
            const monthStr = format(date, 'yyyy-MM');
            const dayStr = `${monthStr}-${10}`; // Due date 10th

            manualFixedCosts.forEach(mc => {
                if (!mc.active) return;
                const amount = mc.getAmount(date);
                if (amount <= 0) return;

                const isPaid = mc.paidMonths?.includes(monthStr);

                generated.push({
                    id: `manual-${mc.id}-${monthStr}`,
                    description: mc.description,
                    category: mc.category,
                    expected: amount,
                    actual: amount, // Assuming fixed value is the actual/expected
                    month: dayStr, // YYYY-MM-DD
                    status: isPaid ? 'paid' : 'pending',
                    created_at: new Date().toISOString(),
                    recurrence: 'monthly'
                } as unknown as FixedCost);
            });
        });
        return generated;
    }, []);

    const allFixedCosts = useMemo(() => {
        return [...(fixedCosts || []), ...virtualFixedCosts];
    }, [fixedCosts, virtualFixedCosts]);

    const { data: variableCosts, isLoading: loadingVariable } = useQuery({
        // ... existing variable costs query
        queryKey: ["variable_costs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("variable_costs")
                .select("*")
                .order("month");
            if (error) throw error;
            return data as unknown as VariableCost[];
        },
    });

    // GENERATE REVENUE TAX COSTS (11%)
    const allVariableCosts = useMemo(() => {
        if (!invoices) return variableCosts || [];

        const taxes: VariableCost[] = [];
        // Iterate relevant months (e.g. 2026)
        const start = new Date(2026, 0, 1);
        const end = new Date(2026, 11, 31);
        const months = eachMonthOfInterval({ start, end });

        months.forEach(month => {
            // Revenue for this month
            const monthRevenue = (invoices || [])
                .filter(inv => {
                    if (!inv.paid_date) return false;
                    const pDate = new Date(inv.paid_date);
                    return isSameMonth(pDate, month);
                })
                .reduce((sum, inv) => sum + Number(inv.value), 0);

            if (monthRevenue <= 0) return;

            const taxAmount = monthRevenue * 0.11;

            // Due Date: 20th of NEXT month
            // We use 'addMonths' and set date to 20.
            // Need to import addMonths or just increment month index.
            const nextMonth = new Date(month);
            nextMonth.setMonth(month.getMonth() + 1);
            nextMonth.setDate(20);

            const dueDateStr = format(nextMonth, 'yyyy-MM-dd');
            taxes.push({
                id: `tax-${format(month, 'yyyy-MM')}`,
                description: `Imposto sobre Receita (${format(month, 'MMM/yy')})`,
                category: 'Impostos',
                amount: taxAmount,
                date: dueDateStr,
                month: format(nextMonth, 'yyyy-MM'), // The month it belongs to in terms of Cashflow (Payment)
                status: 'pending',  // Impostos sempre devem ser gerados como pendentes até pagamento real
                created_at: new Date().toISOString()
            } as unknown as VariableCost);
        });

        return [...(variableCosts || []), ...taxes];
    }, [invoices, variableCosts]);

    const { data: transactions, isLoading: loadingTransactions } = useQuery({
        queryKey: ["transactions"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .order("date", { ascending: false });
            if (error) throw error;
            return data as unknown as Transaction[];
        },
    });

    const isLoading =
        loadingClients ||
        loadingInvoices ||
        loadingFixed ||
        loadingVariable ||
        loadingTransactions;

    const value = useMemo(() => ({
        clients: clients || [],
        invoices: invoices || [],
        fixedCosts: allFixedCosts, // Use merged list
        variableCosts: allVariableCosts, // Use merged variable costs
        transactions: transactions || [],
        isLoading,
        selectedMonth,
        setSelectedMonth,
        dateRange,
        setDateRange
    }), [clients, invoices, allFixedCosts, allVariableCosts, transactions, isLoading, selectedMonth, dateRange]);

    return (
        <FinancialContext.Provider value={value}>
            {children}
        </FinancialContext.Provider>
    );
}

export function useFinancialData() {
    const context = useContext(FinancialContext);
    if (context === undefined) {
        throw new Error("useFinancialData must be used within a FinancialProvider");
    }
    return context;
}
