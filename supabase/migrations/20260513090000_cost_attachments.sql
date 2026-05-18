-- Private receipts/invoices for fixed and variable costs.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-receipts',
  'expense-receipts',
  false,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS public.cost_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('fixed', 'variable')),
  fixed_cost_id UUID REFERENCES public.fixed_costs(id) ON DELETE CASCADE,
  variable_cost_id UUID REFERENCES public.variable_costs(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp')),
  file_size INTEGER CHECK (file_size IS NULL OR file_size <= 10485760),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT cost_attachments_one_parent CHECK (
    (cost_type = 'fixed' AND fixed_cost_id IS NOT NULL AND variable_cost_id IS NULL)
    OR
    (cost_type = 'variable' AND variable_cost_id IS NOT NULL AND fixed_cost_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS cost_attachments_org_idx ON public.cost_attachments (organization_id);
CREATE INDEX IF NOT EXISTS cost_attachments_fixed_cost_idx ON public.cost_attachments (fixed_cost_id);
CREATE INDEX IF NOT EXISTS cost_attachments_variable_cost_idx ON public.cost_attachments (variable_cost_id);

CREATE OR REPLACE FUNCTION public.set_cost_attachment_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_org_id UUID;
BEGIN
  IF NEW.cost_type = 'fixed' THEN
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

DROP TRIGGER IF EXISTS set_cost_attachment_organization_trigger ON public.cost_attachments;
CREATE TRIGGER set_cost_attachment_organization_trigger
BEFORE INSERT OR UPDATE ON public.cost_attachments
FOR EACH ROW
EXECUTE FUNCTION public.set_cost_attachment_organization();

ALTER TABLE public.cost_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage cost attachments in their organization" ON public.cost_attachments;
CREATE POLICY "Users can manage cost attachments in their organization"
  ON public.cost_attachments FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can read expense receipt objects in their organization" ON storage.objects;
CREATE POLICY "Users can read expense receipt objects in their organization"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND EXISTS (
      SELECT 1
      FROM public.users_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id::text = split_part(name, '/', 2)
    )
  );

DROP POLICY IF EXISTS "Users can upload expense receipt objects in their organization" ON storage.objects;
CREATE POLICY "Users can upload expense receipt objects in their organization"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'expense-receipts'
    AND split_part(name, '/', 1) = 'org'
    AND EXISTS (
      SELECT 1
      FROM public.users_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id::text = split_part(name, '/', 2)
    )
  );

DROP POLICY IF EXISTS "Users can update expense receipt objects in their organization" ON storage.objects;
CREATE POLICY "Users can update expense receipt objects in their organization"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND EXISTS (
      SELECT 1
      FROM public.users_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id::text = split_part(name, '/', 2)
    )
  )
  WITH CHECK (
    bucket_id = 'expense-receipts'
    AND EXISTS (
      SELECT 1
      FROM public.users_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id::text = split_part(name, '/', 2)
    )
  );

DROP POLICY IF EXISTS "Users can delete expense receipt objects in their organization" ON storage.objects;
CREATE POLICY "Users can delete expense receipt objects in their organization"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND EXISTS (
      SELECT 1
      FROM public.users_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id::text = split_part(name, '/', 2)
    )
  );
