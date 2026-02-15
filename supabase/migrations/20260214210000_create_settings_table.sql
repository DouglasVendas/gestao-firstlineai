CREATE TABLE IF NOT EXISTS public.saas_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'Minha Empresa',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0f172a',
  currency TEXT DEFAULT 'BRL',
  business_model TEXT DEFAULT 'B2B_SAAS', -- values: B2B_SAAS, B2B_SERVICE
  mrr_goal NUMERIC DEFAULT 100000,
  setup_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saas_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow public read" ON public.saas_settings;
CREATE POLICY "Allow public read" ON public.saas_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write" ON public.saas_settings;
CREATE POLICY "Allow public write" ON public.saas_settings FOR ALL USING (true);

-- Insert default row if not exists (Singleton pattern)
INSERT INTO public.saas_settings (company_name, setup_completed)
SELECT 'Minha Empresa', false
WHERE NOT EXISTS (SELECT 1 FROM public.saas_settings);
