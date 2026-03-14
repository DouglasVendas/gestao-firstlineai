-- Migration: Normalize Database (ERP Phase 2)
-- Purpose: Standardize status columns, ensure plan_id, and prepare categories.

-- 1. Standardize Invoices Status
UPDATE public.invoices SET status = 'paid' WHERE status ILIKE 'pago';
UPDATE public.invoices SET status = 'overdue' WHERE status ILIKE 'atrasada%';
UPDATE public.invoices SET status = 'pending' WHERE status ILIKE 'pendente';

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check 
  CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded'));

-- 2. Add Status to Costs
ALTER TABLE public.fixed_costs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'paid' 
  CHECK (status IN ('pending', 'paid', 'cancelled'));

ALTER TABLE public.variable_costs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'paid' 
  CHECK (status IN ('pending', 'paid', 'cancelled'));

UPDATE public.fixed_costs SET status = 'paid' WHERE status IS NULL;
UPDATE public.variable_costs SET status = 'paid' WHERE status IS NULL;

-- 3. Create Categories Table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fixed', 'variable', 'both')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, name)
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's categories"
  ON public.expense_categories FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
    ) OR organization_id IS NULL -- Global categories
  );

CREATE POLICY "Admin users can manage organization categories"
  ON public.expense_categories FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert Default Categories
INSERT INTO public.expense_categories (name, type) VALUES 
  ('Pessoal', 'both'),
  ('Impostos', 'variable'),
  ('Infraestrutura', 'fixed'),
  ('Marketing', 'variable'),
  ('Software', 'fixed'),
  ('Outros', 'both')
ON CONFLICT DO NOTHING;

-- 4. Clients plan_id foreign key constraint is already set up in types.ts (clients_plan_id_fkey)
-- We will just make it strict for future if necessary, but leaving nullable is safer for custom MRR without plans.
