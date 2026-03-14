-- Migration: Financial Settings & Recurring Fixed Costs (Multi-Tenant)
-- Purpose: Remove hardcoded financial settings (financialConfig.ts) to the database

-- 1. Create Financial Settings Table
CREATE TABLE IF NOT EXISTS public.financial_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  balance_reference_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id)
);

-- RLS policies for financial_settings
ALTER TABLE public.financial_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's financial settings"
  ON public.financial_settings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can update their organization's financial settings"
  ON public.financial_settings FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
  
CREATE POLICY "Admin users can insert their organization's financial settings"
  ON public.financial_settings FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Create Recurring Fixed Costs Table
CREATE TABLE IF NOT EXISTS public.recurring_fixed_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  due_date_day INTEGER NOT NULL CHECK (due_date_day >= 1 AND due_date_day <= 31),
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- RLS policies for recurring_fixed_costs
ALTER TABLE public.recurring_fixed_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's recurring fixed costs"
  ON public.recurring_fixed_costs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin/Finance users can manage recurring fixed costs"
  ON public.recurring_fixed_costs FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

-- 3. Trigger for updated_at in financial_settings
CREATE OR REPLACE FUNCTION update_financial_settings_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_financial_settings_modtime
  BEFORE UPDATE ON public.financial_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_settings_updated_at_column();
