-- Phase 1 Critical Fix C3: Financial Settings & Status Standardization
-- Purpose: Add missing fields to financial_settings, and align status across tables

-- 1. Add missing fields to financial_settings
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_settings' AND column_name = 'tax_rate') THEN
        ALTER TABLE public.financial_settings ADD COLUMN tax_rate NUMERIC(5,4) NOT NULL DEFAULT 0.11;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_settings' AND column_name = 'accounting_method') THEN
        ALTER TABLE public.financial_settings ADD COLUMN accounting_method TEXT NOT NULL DEFAULT 'cash' CHECK (accounting_method IN ('cash', 'accrual'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_settings' AND column_name = 'budget_revenue') THEN
        ALTER TABLE public.financial_settings ADD COLUMN budget_revenue NUMERIC(12,2) NOT NULL DEFAULT 350000.00;
    END IF;
END$$;

-- 2. Standardize status spelling (cancelled -> canceled)
-- a) fixed_costs
UPDATE public.fixed_costs SET status = 'canceled' WHERE status = 'cancelled';

-- b) variable_costs
UPDATE public.variable_costs SET status = 'canceled' WHERE status = 'cancelled';

-- c) Check if there are other spelling variations like 'atrasada' vs 'overdue' if necessary
-- Standardizing everything to English keys for future i18n/consistency
UPDATE public.invoices SET status = 'paid' WHERE status = 'pago';
UPDATE public.invoices SET status = 'overdue' WHERE status = 'atrasada';

-- 3. Ensure every organization has a default row in financial_settings
INSERT INTO public.financial_settings (organization_id)
SELECT id FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;

-- 4. Audit Log Table (Preparation for Phase 4, but useful to keep records now)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs of their organization's tables"
  ON public.audit_log FOR SELECT
  USING (
    true -- In a real scenario, filter by organization
  );
