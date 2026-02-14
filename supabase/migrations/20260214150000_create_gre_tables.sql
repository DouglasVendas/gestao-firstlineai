-- Create GRE Pillars table
CREATE TABLE IF NOT EXISTS public.gre_pillars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create GRE Modules table
CREATE TABLE IF NOT EXISTS public.gre_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID NOT NULL REFERENCES public.gre_pillars(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'diagnostic', 'playbook', 'metric', 'model', 'ai'
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create GRE Assessment table (stores user progress/data per module)
CREATE TABLE IF NOT EXISTS public.gre_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References auth.users, but we might not have FK constraint strictly if using simplistic auth
    module_id UUID NOT NULL REFERENCES public.gre_modules(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    data JSONB DEFAULT '{}'::jsonb, -- Stores form answers or specific module state
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create GRE Simulation Inputs table (for the Scale Simulator)
CREATE TABLE IF NOT EXISTS public.gre_simulation_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    cac NUMERIC,
    ltv NUMERIC,
    mmr NUMERIC,
    churn_rate NUMERIC,
    burn_rate NUMERIC,
    current_cash NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Initial Data: 5 Pillars
INSERT INTO public.gre_pillars (title, "order") VALUES
('Oferta & Posicionamento', 1),
('Aquisição & Comercial', 2),
('Entrega & Retenção', 3),
('Financeiro & Unit Economics', 4),
('Inteligência & Escala', 5);

-- Insert Initial Data: Modules for each Pillar
-- We use a DO block to look up the pillar IDs dynamically
DO $$
DECLARE
    p_offer UUID;
    p_acquisition UUID;
    p_delivery UUID;
    p_finance UUID;
    p_intelligence UUID;
BEGIN
    SELECT id INTO p_offer FROM public.gre_pillars WHERE title = 'Oferta & Posicionamento';
    SELECT id INTO p_acquisition FROM public.gre_pillars WHERE title = 'Aquisição & Comercial';
    SELECT id INTO p_delivery FROM public.gre_pillars WHERE title = 'Entrega & Retenção';
    SELECT id INTO p_finance FROM public.gre_pillars WHERE title = 'Financeiro & Unit Economics';
    SELECT id INTO p_intelligence FROM public.gre_pillars WHERE title = 'Inteligência & Escala';

    -- Pilar 1: Oferta
    INSERT INTO public.gre_modules (pillar_id, title, type, "order") VALUES
    (p_offer, 'Diagnóstico de Oferta', 'diagnostic', 1),
    (p_offer, 'Playbook de Posicionamento', 'playbook', 2),
    (p_offer, 'Métricas de Conversão', 'metric', 3),
    (p_offer, 'Modelo de Proposta', 'model', 4),
    (p_offer, 'Auditor de ICP', 'ai', 5);

    -- Pilar 2: Aquisição
    INSERT INTO public.gre_modules (pillar_id, title, type, "order") VALUES
    (p_acquisition, 'Diagnóstico de Canais', 'diagnostic', 1),
    (p_acquisition, 'Playbook de Vendas', 'playbook', 2),
    (p_acquisition, 'CAC & LTV', 'metric', 3),
    (p_acquisition, 'Script de Vendas', 'model', 4),
    (p_acquisition, 'Simulador de Tráfego', 'ai', 5);

    -- Pilar 3: Entrega
    INSERT INTO public.gre_modules (pillar_id, title, type, "order") VALUES
    (p_delivery, 'Diagnóstico de Onboarding', 'diagnostic', 1),
    (p_delivery, 'Playbook de CS', 'playbook', 2),
    (p_delivery, 'Churn & NPS', 'metric', 3),
    (p_delivery, 'Modelo de QBR', 'model', 4),
    (p_delivery, 'Preditor de Churn', 'ai', 5);

    -- Pilar 4: Financeiro
    INSERT INTO public.gre_modules (pillar_id, title, type, "order") VALUES
    (p_finance, 'Diagnóstico de Cashflow', 'diagnostic', 1),
    (p_finance, 'Playbook de Cobrança', 'playbook', 2),
    (p_finance, 'Margem & Burn Rate', 'metric', 3),
    (p_finance, 'Planilha de Unit Economics', 'model', 4),
    (p_finance, 'Auditor de Runway', 'ai', 5);

    -- Pilar 5: Inteligência
    INSERT INTO public.gre_modules (pillar_id, title, type, "order") VALUES
    (p_intelligence, 'Diagnóstico de Dados', 'diagnostic', 1),
    (p_intelligence, 'Playbook de BI', 'playbook', 2),
    (p_intelligence, 'Magic Number', 'metric', 3),
    (p_intelligence, 'Dashboards Padrão', 'model', 4),
    (p_intelligence, 'Detector de Gargalos', 'ai', 5);

END $$;
