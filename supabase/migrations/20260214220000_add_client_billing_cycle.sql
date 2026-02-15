ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'yearly'));

-- Update existing clients to have distinct values for demonstration (optional, but helpful for dev)
UPDATE public.clients SET billing_cycle = 'yearly' WHERE mrr > 5000;
