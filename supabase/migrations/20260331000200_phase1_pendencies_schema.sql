-- Phase 1 Pending Items: MRR tracking & Financial Configuration
-- Purpose: Support Expansion/Contraction MRR (P1), DRE details (P4), Valuation (P5), and CAC (P7)

-- 1. Create mrr_changes table (P1)
CREATE TABLE IF NOT EXISTS public.mrr_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  change_date DATE NOT NULL DEFAULT CURRENT_DATE,
  previous_mrr NUMERIC(12,2) NOT NULL,
  new_mrr NUMERIC(12,2) NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('new', 'expansion', 'contraction', 'churn', 'reactivation')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for mrr_changes
ALTER TABLE public.mrr_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view mrr_changes for their organization's clients"
  ON public.mrr_changes FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE organization_id IN (
        SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- 2. Add additional fields to financial_settings (P4, P5, P7)
DO $$
BEGIN
    -- P4: Depreciation, Financial Result, IR/CSLL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_settings' AND column_name = 'depreciation_monthly') THEN
        ALTER TABLE public.financial_settings ADD COLUMN depreciation_monthly NUMERIC(12,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_settings' AND column_name = 'financial_result_monthly') THEN
        ALTER TABLE public.financial_settings ADD COLUMN financial_result_monthly NUMERIC(12,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_settings' AND column_name = 'ir_csll_rate') THEN
        ALTER TABLE public.financial_settings ADD COLUMN ir_csll_rate NUMERIC(5,4) DEFAULT 0;
    END IF;

    -- P5: Private Discount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_settings' AND column_name = 'private_discount') THEN
        ALTER TABLE public.financial_settings ADD COLUMN private_discount NUMERIC(5,4) DEFAULT 0.20;
    END IF;

    -- P7: CAC Categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_settings' AND column_name = 'cac_categories') THEN
        ALTER TABLE public.financial_settings ADD COLUMN cac_categories JSONB DEFAULT '["marketing", "anúncio", "ads", "google", "facebook", "vendas", "comercial", "comissão", "sdr", "sales"]'::jsonb;
    END IF;
END$$;
