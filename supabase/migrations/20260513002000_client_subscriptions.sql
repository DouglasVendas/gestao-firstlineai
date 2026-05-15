-- Professional subscription model: clients can contract multiple products,
-- each product has its own plan, and CRM can carry priced add-ons.

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(12,2) NOT NULL DEFAULT 0,
  starts_at DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, name, starts_at)
);

CREATE TABLE IF NOT EXISTS public.client_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_plan_id UUID NOT NULL REFERENCES public.product_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'churned', 'inactive')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'yearly')),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_subscription_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.client_subscriptions(id) ON DELETE CASCADE,
  addon_code TEXT NOT NULL CHECK (addon_code IN ('crm_extra_users', 'crm_extra_channels')),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subscription_id, addon_code)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_subscription_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read products" ON public.products;
CREATE POLICY "Authenticated users can read products"
  ON public.products FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can read product plans" ON public.product_plans;
CREATE POLICY "Authenticated users can read product plans"
  ON public.product_plans FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can manage client subscriptions in their organization" ON public.client_subscriptions;
CREATE POLICY "Users can manage client subscriptions in their organization"
  ON public.client_subscriptions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.clients c
      JOIN public.users_organizations uo ON uo.organization_id = c.organization_id
      WHERE c.id = client_subscriptions.client_id
        AND uo.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.clients c
      JOIN public.users_organizations uo ON uo.organization_id = c.organization_id
      WHERE c.id = client_subscriptions.client_id
        AND uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage subscription add-ons in their organization" ON public.client_subscription_addons;
CREATE POLICY "Users can manage subscription add-ons in their organization"
  ON public.client_subscription_addons FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.client_subscriptions cs
      JOIN public.clients c ON c.id = cs.client_id
      JOIN public.users_organizations uo ON uo.organization_id = c.organization_id
      WHERE cs.id = client_subscription_addons.subscription_id
        AND uo.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.client_subscriptions cs
      JOIN public.clients c ON c.id = cs.client_id
      JOIN public.users_organizations uo ON uo.organization_id = c.organization_id
      WHERE cs.id = client_subscription_addons.subscription_id
        AND uo.user_id = auth.uid()
    )
  );

INSERT INTO public.products (code, name, description)
VALUES
  ('audit', 'Auditoria', 'Audit Hub'),
  ('crm', 'CRM', 'Sales Hub')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description;

WITH product_ids AS (
  SELECT
    (SELECT id FROM public.products WHERE code = 'audit') AS audit_id,
    (SELECT id FROM public.products WHERE code = 'crm') AS crm_id
)
INSERT INTO public.product_plans (product_id, name, starts_at, ends_at, sort_order)
SELECT audit_id, 'Starter', DATE '2020-01-01', DATE '2026-04-30', 10 FROM product_ids
UNION ALL SELECT audit_id, 'Team', DATE '2020-01-01', DATE '2026-04-30', 20 FROM product_ids
UNION ALL SELECT audit_id, 'Business', DATE '2020-01-01', DATE '2026-04-30', 30 FROM product_ids
UNION ALL SELECT audit_id, 'Professional', DATE '2026-05-01', NULL, 40 FROM product_ids
UNION ALL SELECT audit_id, 'Enterprise', DATE '2026-05-01', NULL, 50 FROM product_ids
UNION ALL SELECT crm_id, 'Starter', DATE '2020-01-01', NULL, 10 FROM product_ids
ON CONFLICT (product_id, name, starts_at) DO NOTHING;
