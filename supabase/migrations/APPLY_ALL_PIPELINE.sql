-- =============================================================
-- MIGRATION CONSOLIDADA: Pipeline CRM Completo
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- https://supabase.com/dashboard/project/eeudoelnnsmavaugfhwv/sql/new
-- =============================================================

-- ┌─────────────────────────────────────────────────┐
-- │ 1. TABELA DE DEALS (Pipeline)                   │
-- └─────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT,
    contact_name TEXT,
    contact_email TEXT,
    value NUMERIC DEFAULT 0,
    stage TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    priority TEXT DEFAULT 'warm' CHECK (priority IN ('cold', 'warm', 'hot')),
    notes TEXT,
    source TEXT,
    lost_reason TEXT,
    expected_close_date DATE,
    next_followup_date DATE,
    next_followup_type TEXT,
    plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'deals_public') THEN
        CREATE POLICY "deals_public" ON public.deals FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);

-- ┌─────────────────────────────────────────────────┐
-- │ 2. TABELA DE ATIVIDADES                         │
-- └─────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.deal_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'whatsapp', 'proposal_sent', 'follow_up', 'stage_change')),
    title TEXT NOT NULL,
    description TEXT,
    outcome TEXT,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'deal_activities_public') THEN
        CREATE POLICY "deal_activities_public" ON public.deal_activities FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_deal_activities_deal ON public.deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_scheduled ON public.deal_activities(scheduled_at) WHERE is_completed = false;

ALTER TABLE public.deal_activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ┌─────────────────────────────────────────────────┐
-- │ 3. TABELA DE TAGS                               │
-- └─────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.deal_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deal_tag_links (
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.deal_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (deal_id, tag_id)
);

ALTER TABLE public.deal_tags ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'deal_tags_public') THEN
        CREATE POLICY "deal_tags_public" ON public.deal_tags FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

ALTER TABLE public.deal_tag_links ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'deal_tag_links_public') THEN
        CREATE POLICY "deal_tag_links_public" ON public.deal_tag_links FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ┌─────────────────────────────────────────────────┐
-- │ 4. SEED: TAGS PADRÃO                            │
-- └─────────────────────────────────────────────────┘
INSERT INTO public.deal_tags (name, color) VALUES
    ('Upsell', '#f59e0b'),
    ('Novo Cliente', '#22c55e'),
    ('Enterprise', '#6366f1'),
    ('Indicação', '#ec4899'),
    ('Renovação', '#14b8a6'),
    ('Urgente', '#ef4444')
ON CONFLICT (name) DO NOTHING;

-- ┌─────────────────────────────────────────────────┐
-- │ 5. SEED: DEALS INICIAIS                         │
-- └─────────────────────────────────────────────────┘
INSERT INTO public.deals (title, company, contact_name, contact_email, value, stage, priority, notes, source, expected_close_date, next_followup_date, next_followup_type, billing_cycle) VALUES
    ('Contrato Enterprise ABC', 'ABC Corp', 'João Silva', 'joao@abc.com', 15000, 'negotiation', 'hot', 'Reunião marcada para sexta', 'Indicação', '2026-03-01', '2026-02-17', 'meeting', 'monthly'),
    ('Expansão Plano Pro', 'Tech Solutions', 'Maria Santos', 'maria@tech.com', 5000, 'proposal', 'warm', 'Proposta enviada, aguardando retorno', 'Inbound', '2026-03-15', '2026-02-18', 'call', 'monthly'),
    ('Novo Cliente - Startup XYZ', 'Startup XYZ', 'Pedro Lima', 'pedro@xyz.com', 2500, 'lead', 'cold', 'Indicação do Carlos', 'Indicação', NULL, '2026-02-20', 'email', NULL),
    ('Migração Plataforma Delta', 'Delta Ltda', 'Ana Costa', 'ana@delta.com', 8000, 'qualified', 'warm', 'Demonstração agendada', 'Website', '2026-02-28', '2026-02-16', 'meeting', 'monthly'),
    ('Licença Anual GammaFi', 'GammaFi', 'Lucas Rocha', 'lucas@gammafi.com', 24000, 'closed_won', 'hot', 'Contrato assinado!', 'Outbound', '2026-02-10', NULL, NULL, 'yearly'),
    ('SaaS Pack Omega', 'Omega Inc', 'Fernanda Alves', 'fer@omega.com', 12000, 'lead', 'warm', 'Primeiro contato via LinkedIn', 'LinkedIn', '2026-04-01', '2026-02-19', 'whatsapp', NULL)
ON CONFLICT DO NOTHING;

-- ┌─────────────────────────────────────────────────┐
-- │ 6. SEED: ATIVIDADES INICIAIS                    │
-- └─────────────────────────────────────────────────┘
DO $$
DECLARE
    deal1_id UUID;
    deal2_id UUID;
    deal4_id UUID;
BEGIN
    SELECT id INTO deal1_id FROM public.deals WHERE title = 'Contrato Enterprise ABC' LIMIT 1;
    SELECT id INTO deal2_id FROM public.deals WHERE title = 'Expansão Plano Pro' LIMIT 1;
    SELECT id INTO deal4_id FROM public.deals WHERE title = 'Migração Plataforma Delta' LIMIT 1;

    IF deal1_id IS NOT NULL THEN
        INSERT INTO public.deal_activities (deal_id, type, title, description, outcome, scheduled_at, completed_at, is_completed)
        VALUES
            (deal1_id, 'meeting', 'Reunião de descoberta', 'Entender as necessidades de automação financeira', 'Cliente interessado. Enviar proposta até sexta.', '2026-02-10T14:00:00Z', '2026-02-10T15:30:00Z', true),
            (deal1_id, 'proposal_sent', 'Proposta comercial enviada', 'Plano Enterprise com desconto de 15%', NULL, NULL, '2026-02-12T10:00:00Z', true),
            (deal1_id, 'follow_up', 'Follow-up pós proposta', 'Ligar para saber se tem dúvidas', NULL, '2026-02-17T10:00:00Z', NULL, false);
    END IF;

    IF deal2_id IS NOT NULL THEN
        INSERT INTO public.deal_activities (deal_id, type, title, description, outcome, scheduled_at, completed_at, is_completed)
        VALUES
            (deal2_id, 'call', 'Qualificação por telefone', 'Confirmar fit do produto', 'Qualificado. Dor clara: falta de DRE automatizado', NULL, '2026-02-07T11:00:00Z', true),
            (deal2_id, 'email', 'Envio de case de sucesso', 'Enviar case da empresa similar no mesmo segmento', NULL, '2026-02-18T09:00:00Z', NULL, false);
    END IF;

    IF deal4_id IS NOT NULL THEN
        INSERT INTO public.deal_activities (deal_id, type, title, description, outcome, scheduled_at, completed_at, is_completed)
        VALUES
            (deal4_id, 'meeting', 'Demo agendada', 'Mostrar dashboards e importação de dados', NULL, '2026-02-16T15:00:00Z', NULL, false);
    END IF;
END $$;

-- ┌─────────────────────────────────────────────────┐
-- │ 7. SEED: LINKS DEAL <-> TAGS                    │
-- └─────────────────────────────────────────────────┘
DO $$
DECLARE
    deal1_id UUID;
    deal3_id UUID;
    deal5_id UUID;
    deal6_id UUID;
    tag_enterprise UUID;
    tag_indicacao UUID;
    tag_upsell UUID;
    tag_novo UUID;
    tag_renovacao UUID;
BEGIN
    SELECT id INTO deal1_id FROM public.deals WHERE title = 'Contrato Enterprise ABC' LIMIT 1;
    SELECT id INTO deal3_id FROM public.deals WHERE title = 'Novo Cliente - Startup XYZ' LIMIT 1;
    SELECT id INTO deal5_id FROM public.deals WHERE title = 'Licença Anual GammaFi' LIMIT 1;
    SELECT id INTO deal6_id FROM public.deals WHERE title = 'SaaS Pack Omega' LIMIT 1;

    SELECT id INTO tag_enterprise FROM public.deal_tags WHERE name = 'Enterprise' LIMIT 1;
    SELECT id INTO tag_indicacao FROM public.deal_tags WHERE name = 'Indicação' LIMIT 1;
    SELECT id INTO tag_upsell FROM public.deal_tags WHERE name = 'Upsell' LIMIT 1;
    SELECT id INTO tag_novo FROM public.deal_tags WHERE name = 'Novo Cliente' LIMIT 1;
    SELECT id INTO tag_renovacao FROM public.deal_tags WHERE name = 'Renovação' LIMIT 1;

    -- Contrato Enterprise ABC -> Enterprise, Indicação
    IF deal1_id IS NOT NULL AND tag_enterprise IS NOT NULL THEN INSERT INTO public.deal_tag_links VALUES (deal1_id, tag_enterprise) ON CONFLICT DO NOTHING; END IF;
    IF deal1_id IS NOT NULL AND tag_indicacao IS NOT NULL THEN INSERT INTO public.deal_tag_links VALUES (deal1_id, tag_indicacao) ON CONFLICT DO NOTHING; END IF;

    -- Startup XYZ -> Novo Cliente, Indicação
    IF deal3_id IS NOT NULL AND tag_novo IS NOT NULL THEN INSERT INTO public.deal_tag_links VALUES (deal3_id, tag_novo) ON CONFLICT DO NOTHING; END IF;
    IF deal3_id IS NOT NULL AND tag_indicacao IS NOT NULL THEN INSERT INTO public.deal_tag_links VALUES (deal3_id, tag_indicacao) ON CONFLICT DO NOTHING; END IF;

    -- GammaFi -> Enterprise, Renovação
    IF deal5_id IS NOT NULL AND tag_enterprise IS NOT NULL THEN INSERT INTO public.deal_tag_links VALUES (deal5_id, tag_enterprise) ON CONFLICT DO NOTHING; END IF;
    IF deal5_id IS NOT NULL AND tag_renovacao IS NOT NULL THEN INSERT INTO public.deal_tag_links VALUES (deal5_id, tag_renovacao) ON CONFLICT DO NOTHING; END IF;

    -- Omega -> Novo Cliente
    IF deal6_id IS NOT NULL AND tag_novo IS NOT NULL THEN INSERT INTO public.deal_tag_links VALUES (deal6_id, tag_novo) ON CONFLICT DO NOTHING; END IF;
END $$;

-- ✅ Pronto! Todas as tabelas criadas e dados seed inseridos.
SELECT 'Migration concluída com sucesso!' AS status,
       (SELECT COUNT(*) FROM public.deals) AS total_deals,
       (SELECT COUNT(*) FROM public.deal_activities) AS total_activities,
       (SELECT COUNT(*) FROM public.deal_tags) AS total_tags,
       (SELECT COUNT(*) FROM public.deal_tag_links) AS total_tag_links;
