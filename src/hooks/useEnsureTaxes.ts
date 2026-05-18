import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "./useInvoices";
import { VariableCost } from "./useVariableCosts";
import { FinancialSettings } from "./useFinancialSettings";
import { buildAutomaticTaxRows } from "@/utils/automaticTaxes";

/**
 * Hook: useEnsureTaxes
 *
 * Replaces the dynamic tax generation in FinancialContext with proper DB persistence.
 *
 * Behavior:
 * 1. Groups paid invoices by their revenue month (paid_date)
 * 2. Checks if auto-generated tax entry already exists for each month
 * 3. For months with revenue but no auto-generated tax: inserts a single entry
 * 4. Invalidates React Query cache to reflect new taxes
 * 5. Unique DB index prevents duplicates even with concurrent calls
 *
 * @param invoices - Array of invoices from React Query
 * @param variableCosts - Array of variable costs from React Query (to check for existing taxes)
 * @param settings - Financial settings from DB
 *
 * @returns void (side effect: inserts taxes to DB via Supabase)
 */
export const useEnsureTaxes = (invoices: Invoice[], variableCosts: VariableCost[], settings?: FinancialSettings) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!invoices || invoices.length === 0 || !settings) {
            return;
        }

        const taxRows = buildAutomaticTaxRows({
            invoices,
            existingCosts: variableCosts || [],
            taxRate: settings.tax_rate,
            organizationId: settings.organization_id,
        });

        if (taxRows.length === 0) {
            return;
        }

        const taxPromises = taxRows.map(async ({ id, ...row }) => {
            const result = id
                ? await supabase
                    .from('variable_costs')
                    .update(row)
                    .eq('id', id)
                : await supabase
                    .from('variable_costs')
                    .insert(row);

            if (result.error) throw result.error;
            return result;
        });

        Promise.allSettled(taxPromises).then((results) => {
            const anySuccess = results.some(r => r.status === 'fulfilled');

            if (anySuccess) {
                queryClient.invalidateQueries({ queryKey: ['variable_costs'] });
            }

            results.forEach((result, idx) => {
                if (result.status === 'rejected') {
                    console.debug(
                        `[useEnsureTaxes] Failed to sync tax row ${idx}:`,
                        result.reason.message
                    );
                }
            });
        });

    }, [invoices, variableCosts, settings?.tax_rate, settings?.organization_id, queryClient]);
};
