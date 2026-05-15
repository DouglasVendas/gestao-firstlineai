-- Automatic variable tax costs: 6% of confirmed receipts, due every day 20.

ALTER TABLE public.financial_settings
  ALTER COLUMN tax_rate SET DEFAULT 0.06;

UPDATE public.financial_settings
SET tax_rate = 0.06
WHERE tax_rate IS NULL OR tax_rate = 0.11;

UPDATE public.variable_costs
SET
  name = 'Imposto sobre Recebimentos',
  category = 'Impostos e Taxas',
  month = (date_trunc('month', month)::date + interval '19 days')::date
WHERE is_auto_generated = TRUE
  AND lower(category) IN ('impostos', 'impostos e taxas');

DROP INDEX IF EXISTS public.variable_costs_auto_generated_month_idx;

CREATE UNIQUE INDEX IF NOT EXISTS variable_costs_auto_tax_month_idx
  ON public.variable_costs (month)
  WHERE is_auto_generated = TRUE
    AND category = 'Impostos e Taxas'
    AND name = 'Imposto sobre Recebimentos';

CREATE OR REPLACE FUNCTION public.prevent_delete_automatic_variable_tax()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_auto_generated = TRUE
    AND OLD.category = 'Impostos e Taxas'
    AND OLD.name = 'Imposto sobre Recebimentos' THEN
    RAISE EXCEPTION 'O imposto automatico nao pode ser removido.';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS prevent_delete_automatic_variable_tax_trigger ON public.variable_costs;
CREATE TRIGGER prevent_delete_automatic_variable_tax_trigger
  BEFORE DELETE ON public.variable_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_delete_automatic_variable_tax();
