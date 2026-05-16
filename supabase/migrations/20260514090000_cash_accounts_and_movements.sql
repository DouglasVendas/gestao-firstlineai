-- Cash accounts and traceable cash movements.

CREATE TABLE IF NOT EXISTS public.cash_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'bank' CHECK (type IN ('bank', 'gateway', 'cash', 'other')),
  name TEXT NOT NULL,
  bank_name TEXT,
  agency TEXT,
  account_number TEXT,
  initial_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  initial_balance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS cash_accounts_org_active_idx
  ON public.cash_accounts (organization_id, active);

CREATE TABLE IF NOT EXISTS public.cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cash_account_id UUID NOT NULL REFERENCES public.cash_accounts(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('income', 'expense', 'transfer_in', 'transfer_out', 'adjustment')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount <> 0),
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'invoice', 'fixed_cost_payment', 'variable_cost', 'transfer', 'adjustment')),
  source_id UUID,
  transfer_group_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS cash_movements_org_date_idx
  ON public.cash_movements (organization_id, movement_date);

CREATE INDEX IF NOT EXISTS cash_movements_account_date_idx
  ON public.cash_movements (cash_account_id, movement_date);

CREATE UNIQUE INDEX IF NOT EXISTS cash_movements_source_unique_idx
  ON public.cash_movements (source_type, source_id)
  WHERE source_id IS NOT NULL AND source_type IN ('invoice', 'fixed_cost_payment', 'variable_cost');

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS cash_account_id UUID REFERENCES public.cash_accounts(id);

ALTER TABLE public.variable_costs
  ADD COLUMN IF NOT EXISTS cash_account_id UUID REFERENCES public.cash_accounts(id);

ALTER TABLE public.fixed_cost_payments
  ADD COLUMN IF NOT EXISTS cash_account_id UUID REFERENCES public.cash_accounts(id);

CREATE OR REPLACE FUNCTION public.set_cash_account_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_cash_account_updated_at_trigger ON public.cash_accounts;
CREATE TRIGGER set_cash_account_updated_at_trigger
BEFORE UPDATE ON public.cash_accounts
FOR EACH ROW
EXECUTE FUNCTION public.set_cash_account_updated_at();

CREATE OR REPLACE FUNCTION public.set_cash_movement_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_org_id UUID;
BEGIN
  SELECT organization_id INTO account_org_id
  FROM public.cash_accounts
  WHERE id = NEW.cash_account_id;

  IF account_org_id IS NULL THEN
    RAISE EXCEPTION 'Conta financeira não encontrada.';
  END IF;

  IF NEW.organization_id IS NOT NULL AND NEW.organization_id <> account_org_id THEN
    RAISE EXCEPTION 'Organização da movimentação não corresponde à conta financeira.';
  END IF;

  NEW.organization_id := account_org_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_cash_movement_organization_trigger ON public.cash_movements;
CREATE TRIGGER set_cash_movement_organization_trigger
BEFORE INSERT OR UPDATE ON public.cash_movements
FOR EACH ROW
EXECUTE FUNCTION public.set_cash_movement_organization();

ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view cash accounts in their organization" ON public.cash_accounts;
CREATE POLICY "Users can view cash accounts in their organization"
  ON public.cash_accounts FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin users can manage cash accounts" ON public.cash_accounts;
CREATE POLICY "Admin users can manage cash accounts"
  ON public.cash_accounts FOR ALL TO authenticated
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

DROP POLICY IF EXISTS "Users can view cash movements in their organization" ON public.cash_movements;
CREATE POLICY "Users can view cash movements in their organization"
  ON public.cash_movements FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin users can manage cash movements" ON public.cash_movements;
CREATE POLICY "Admin users can manage cash movements"
  ON public.cash_movements FOR ALL TO authenticated
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
