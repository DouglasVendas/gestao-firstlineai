import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "./useInvoices";
import { VariableCost } from "./useVariableCosts";
import { parseISO, format, startOfMonth } from "date-fns";

/**
 * Tax rate for "Imposto sobre Receita" (Simples Nacional - 11%)
 * This is extracted to a constant for easier future updates
 */
const TAX_RATE_SIMPLES = 0.11;

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
 *
 * @returns void (side effect: inserts taxes to DB via Supabase)
 */
export const useEnsureTaxes = (invoices: Invoice[], variableCosts: VariableCost[]) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!invoices || invoices.length === 0) {
            return;
        }

        // Step 1: Group paid invoices by revenue month (competence month)
        const revenueByMonth = new Map<string, number>();

        invoices.forEach(inv => {
            // Only consider paid invoices (not pending, overdue, or canceled)
            if (inv.status !== 'paid' || !inv.paid_date) {
                return;
            }

            // Use the first day of the month as the key (YYYY-MM-01)
            // This represents the competence month for the revenue
            const monthKey = format(parseISO(inv.paid_date), 'yyyy-MM-01');
            const currentTotal = revenueByMonth.get(monthKey) ?? 0;
            revenueByMonth.set(monthKey, currentTotal + inv.value);
        });

        if (revenueByMonth.size === 0) {
            // No revenue in any month, nothing to do
            return;
        }

        // Step 2: Find months that have revenue but no auto-generated tax entry
        const existingTaxMonths = new Set<string>();

        if (variableCosts && variableCosts.length > 0) {
            variableCosts.forEach(vc => {
                // Only consider auto-generated tax entries
                if (vc.is_auto_generated && vc.category === 'Impostos' && vc.month) {
                    const monthKey = format(parseISO(vc.month), 'yyyy-MM-01');
                    existingTaxMonths.add(monthKey);
                }
            });
        }

        const missingTaxMonths = Array.from(revenueByMonth.entries()).filter(
            ([monthKey]) => !existingTaxMonths.has(monthKey)
        );

        if (missingTaxMonths.length === 0) {
            // All months with revenue already have taxes
            return;
        }

        // Step 3: Insert taxes for missing months
        const insertPromises = missingTaxMonths.map(async ([monthKey, revenue]) => {
            const taxAmount = revenue * TAX_RATE_SIMPLES;
            const monthDate = parseISO(monthKey);

            // Format the description with locale-aware month/year
            // e.g., "AUTO_GERADO - Imposto sobre Receita (Jan/26)"
            const monthYearStr = format(monthDate, 'MMM/yy', {
                locales: require('date-fns/locale/pt-BR')
            }).toUpperCase();

            return supabase
                .from('variable_costs')
                .insert({
                    category: 'Impostos',
                    description: `AUTO_GERADO - Imposto sobre Receita (${monthYearStr})`,
                    amount: taxAmount,
                    month: monthKey, // YYYY-MM-01 (valid DATE format)
                    status: 'pending',
                    is_auto_generated: true,
                });
        });

        // Execute all inserts in parallel and handle results
        Promise.allSettled(insertPromises).then((results) => {
            // Check if any insert succeeded
            const anySuccess = results.some(r => r.status === 'fulfilled');

            if (anySuccess) {
                // Invalidate the React Query cache so components re-fetch
                // and reflect the newly-added auto-generated taxes
                queryClient.invalidateQueries({ queryKey: ['variable_costs'] });
            }

            // Log any errors (unique constraint violations are expected and OK)
            results.forEach((result, idx) => {
                if (result.status === 'rejected') {
                    const [monthKey] = missingTaxMonths[idx];
                    console.debug(
                        `[useEnsureTaxes] Failed to insert tax for ${monthKey}:`,
                        result.reason.message
                    );
                    // Unique constraint violation is expected if the insert was already done
                    // This is intentional and not an error condition
                }
            });
        });

    }, [invoices, variableCosts, queryClient]); // Re-run if data changes
};
