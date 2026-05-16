import { createContext, useContext, ReactNode, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/hooks/useClients";
import { Invoice } from "@/hooks/useInvoices";
import { FixedCost, fetchFixedCostOccurrences } from "@/hooks/useFixedCosts";
import { VariableCost } from "@/hooks/useVariableCosts";
import { Transaction } from "@/hooks/useTransactions";
import { useEnsureTaxes } from "@/hooks/useEnsureTaxes";
import { useFinancialSettings, FinancialSettings } from "@/hooks/useFinancialSettings";
import { startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";

interface FinancialContextType {
    clients: Client[];
    invoices: Invoice[];
    fixedCosts: FixedCost[];
    variableCosts: VariableCost[];
    transactions: Transaction[];
    mrrChanges: any[];
    settings?: FinancialSettings;
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

    const { settings, isLoading: loadingSettings } = useFinancialSettings();

    const { data: clients, isLoading: loadingClients } = useQuery({
        queryKey: ["clients"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("clients")
                .select(`
                    *,
                    plan:plans(name, price_monthly, price_yearly),
                    subscriptions:client_subscriptions(
                        *,
                        product:products(*),
                        plan:product_plans(*),
                        addons:client_subscription_addons(*)
                    )
                `)
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
        queryKey: ["fixed_costs", selectedMonth.toISOString().slice(0, 7)],
        queryFn: () => fetchFixedCostOccurrences(selectedMonth),
    });

    // ... (other queries)

    // CUSTOS MANUAIS FORAM MOVIDOS PARA O BANCO DE DADOS (recurring_fixed_costs)!
    const allFixedCosts = useMemo(() => {
        return fixedCosts || [];
    }, [fixedCosts]);

    const { data: variableCosts, isLoading: loadingVariable } = useQuery({
        // ... existing variable costs query
        queryKey: ["variable_costs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("variable_costs")
                .select("*, attachments:cost_attachments(*)")
                .order("month");
            if (error) throw error;
            return data as unknown as VariableCost[];
        },
    });

    // Tax generation moved to useEnsureTaxes hook (C1 fix)
    // This hook checks if taxes exist for months with revenue and persists them to DB
    useEnsureTaxes(invoices || [], variableCosts || [], settings);

    // Variable costs now only includes DB-persisted entries (including auto-generated taxes)
    const allVariableCosts = useMemo(() => {
        return variableCosts || [];
    }, [variableCosts]);

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

    const { data: mrrChanges, isLoading: loadingMRR } = useQuery({
        queryKey: ["mrr_changes"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("mrr_changes")
                .select("*")
                .order("change_date", { ascending: false });
            if (error) throw error;
            return data;
        },
    });

    const isLoading =
        loadingClients ||
        loadingInvoices ||
        loadingFixed ||
        loadingVariable ||
        loadingTransactions ||
        loadingSettings ||
        loadingMRR;

    const value = useMemo(() => ({
        clients: clients || [],
        invoices: invoices || [],
        fixedCosts: allFixedCosts,
        variableCosts: allVariableCosts,
        transactions: transactions || [],
        mrrChanges: mrrChanges || [],
        settings,
        isLoading,
        selectedMonth,
        setSelectedMonth,
        dateRange,
        setDateRange
    }), [clients, invoices, allFixedCosts, allVariableCosts, transactions, settings, isLoading, selectedMonth, dateRange]);

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
