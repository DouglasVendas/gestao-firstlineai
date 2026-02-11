import { createContext, useContext, ReactNode, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/hooks/useClients";
import { Invoice } from "@/hooks/useInvoices";
import { FixedCost } from "@/hooks/useFixedCosts";
import { VariableCost } from "@/hooks/useVariableCosts";
import { Transaction } from "@/hooks/useTransactions";

interface FinancialContextType {
    clients: Client[];
    invoices: Invoice[];
    fixedCosts: FixedCost[];
    variableCosts: VariableCost[];
    transactions: Transaction[];
    isLoading: boolean;
    selectedMonth: Date;
    setSelectedMonth: (date: Date) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: ReactNode }) {
    const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
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

    const { data: variableCosts, isLoading: loadingVariable } = useQuery({
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
        fixedCosts: fixedCosts || [],
        variableCosts: variableCosts || [],
        transactions: transactions || [],
        isLoading,
        selectedMonth,
        setSelectedMonth
    }), [clients, invoices, fixedCosts, variableCosts, transactions, isLoading, selectedMonth]);

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
