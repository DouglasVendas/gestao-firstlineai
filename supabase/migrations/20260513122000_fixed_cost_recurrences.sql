-- Fixed costs become recurring contracts with monthly payment occurrences.

ALTER TABLE public.recurring_fixed_costs
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  ADD COLUMN IF NOT EXISTS duration_months INTEGER CHECK (duration_months IS NULL OR duration_months > 0);

ALTER TABLE public.recurring_fixed_costs
  ALTER COLUMN description DROP NOT NULL;

UPDATE public.recurring_fixed_costs
SET name = COALESCE(NULLIF(trim(name), ''), NULLIF(trim(description), ''), category)
WHERE name IS NULL OR trim(name) = '';

ALTER TABLE public.recurring_fixed_costs
  ALTER COLUMN name SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.fixed_cost_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_fixed_cost_id UUID NOT NULL REFERENCES public.recurring_fixed_costs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reference_month DATE NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'canceled')),
  paid_at DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(recurring_fixed_cost_id, reference_month)
);

CREATE INDEX IF NOT EXISTS fixed_cost_payments_org_month_idx
  ON public.fixed_cost_payments (organization_id, reference_month);

CREATE OR REPLACE FUNCTION public.set_fixed_cost_payment_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_org_id UUID;
BEGIN
  SELECT organization_id INTO resolved_org_id
  FROM public.recurring_fixed_costs
  WHERE id = NEW.recurring_fixed_cost_id;

  IF resolved_org_id IS NULL THEN
    RAISE EXCEPTION 'Custo fixo recorrente não encontrado.';
  END IF;

  IF NEW.organization_id IS NOT NULL AND NEW.organization_id <> resolved_org_id THEN
    RAISE EXCEPTION 'Organização do pagamento não corresponde ao custo fixo.';
  END IF;

  NEW.organization_id := resolved_org_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_fixed_cost_payment_organization_trigger ON public.fixed_cost_payments;
CREATE TRIGGER set_fixed_cost_payment_organization_trigger
BEFORE INSERT OR UPDATE ON public.fixed_cost_payments
FOR EACH ROW
EXECUTE FUNCTION public.set_fixed_cost_payment_organization();

-- Migrate legacy monthly fixed costs into recurring records and payment occurrences.
WITH migrated AS (
  INSERT INTO public.recurring_fixed_costs (
    organization_id,
    name,
    description,
    category,
    amount,
    active,
    due_date_day,
    start_date,
    end_date,
    duration_months,
    status,
    created_at
  )
  SELECT
    fc.organization_id,
    fc.name,
    fc.description,
    fc.category,
    fc.actual,
    true,
    LEAST(GREATEST(EXTRACT(DAY FROM COALESCE(fc.month, CURRENT_DATE))::int, 1), 31),
    date_trunc('month', COALESCE(fc.month, CURRENT_DATE))::date,
    date_trunc('month', COALESCE(fc.month, CURRENT_DATE))::date,
    1,
    'ended',
    fc.created_at
  FROM public.fixed_costs fc
  WHERE fc.organization_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.recurring_fixed_costs r
      WHERE r.organization_id = fc.organization_id
        AND r.name = fc.name
        AND r.start_date = date_trunc('month', COALESCE(fc.month, CURRENT_DATE))::date
    )
  RETURNING id, organization_id, name, amount, start_date
)
INSERT INTO public.fixed_cost_payments (
  recurring_fixed_cost_id,
  organization_id,
  reference_month,
  due_date,
  amount,
  status,
  created_at
)
SELECT
  r.id,
  r.organization_id,
  r.start_date,
  r.start_date,
  r.amount,
  'paid',
  now()
FROM migrated r
ON CONFLICT (recurring_fixed_cost_id, reference_month) DO NOTHING;

ALTER TABLE public.fixed_cost_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their organization's recurring fixed costs" ON public.recurring_fixed_costs;
CREATE POLICY "Users can view their organization's recurring fixed costs"
  ON public.recurring_fixed_costs FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin/Finance users can manage recurring fixed costs" ON public.recurring_fixed_costs;
CREATE POLICY "Admin users can manage recurring fixed costs"
  ON public.recurring_fixed_costs FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can view fixed cost payments in their organization" ON public.fixed_cost_payments;
CREATE POLICY "Users can view fixed cost payments in their organization"
  ON public.fixed_cost_payments FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin users can manage fixed cost payments" ON public.fixed_cost_payments;
CREATE POLICY "Admin users can manage fixed cost payments"
  ON public.fixed_cost_payments FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

ALTER TABLE public.cost_attachments
  ADD COLUMN IF NOT EXISTS fixed_cost_payment_id UUID REFERENCES public.fixed_cost_payments(id) ON DELETE CASCADE;

ALTER TABLE public.cost_attachments
  DROP CONSTRAINT IF EXISTS cost_attachments_one_parent;

ALTER TABLE public.cost_attachments
  ADD CONSTRAINT cost_attachments_one_parent CHECK (
    (
      cost_type = 'fixed'
      AND variable_cost_id IS NULL
      AND (
        (fixed_cost_id IS NOT NULL AND fixed_cost_payment_id IS NULL)
        OR (fixed_cost_id IS NULL AND fixed_cost_payment_id IS NOT NULL)
      )
    )
    OR
    (cost_type = 'variable' AND variable_cost_id IS NOT NULL AND fixed_cost_id IS NULL AND fixed_cost_payment_id IS NULL)
  );

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
