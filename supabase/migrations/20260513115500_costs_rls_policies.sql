-- Tenant-aware RLS policies for fixed and variable costs.
-- Viewers can read costs in their organization; owners/admins can create, update and delete.

ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variable_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read" ON public.fixed_costs;
DROP POLICY IF EXISTS "Allow public read" ON public.variable_costs;

DROP POLICY IF EXISTS "Users can read fixed costs in their organization" ON public.fixed_costs;
CREATE POLICY "Users can read fixed costs in their organization"
  ON public.fixed_costs FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.users_organizations
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage fixed costs in their organization" ON public.fixed_costs;
CREATE POLICY "Admins can manage fixed costs in their organization"
  ON public.fixed_costs FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.users_organizations
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.users_organizations
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can read variable costs in their organization" ON public.variable_costs;
CREATE POLICY "Users can read variable costs in their organization"
  ON public.variable_costs FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.users_organizations
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage variable costs in their organization" ON public.variable_costs;
CREATE POLICY "Admins can manage variable costs in their organization"
  ON public.variable_costs FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.users_organizations
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.users_organizations
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );
