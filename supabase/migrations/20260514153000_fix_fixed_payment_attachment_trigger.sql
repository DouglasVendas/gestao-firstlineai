-- Ensure fixed cost payment attachments resolve organization through fixed_cost_payments.

CREATE OR REPLACE FUNCTION public.set_cost_attachment_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_org_id UUID;
BEGIN
  IF NEW.cost_type = 'fixed' AND NEW.fixed_cost_payment_id IS NOT NULL THEN
    SELECT organization_id INTO resolved_org_id
    FROM public.fixed_cost_payments
    WHERE id = NEW.fixed_cost_payment_id;
  ELSIF NEW.cost_type = 'fixed' THEN
    SELECT organization_id INTO resolved_org_id
    FROM public.fixed_costs
    WHERE id = NEW.fixed_cost_id;
  ELSIF NEW.cost_type = 'variable' THEN
    SELECT organization_id INTO resolved_org_id
    FROM public.variable_costs
    WHERE id = NEW.variable_cost_id;
  END IF;

  IF resolved_org_id IS NULL THEN
    RAISE EXCEPTION 'Custo não encontrado para o anexo.';
  END IF;

  IF NEW.organization_id IS NOT NULL AND NEW.organization_id <> resolved_org_id THEN
    RAISE EXCEPTION 'Organização do anexo não corresponde ao custo.';
  END IF;

  NEW.organization_id := resolved_org_id;
  RETURN NEW;
END;
$$;
