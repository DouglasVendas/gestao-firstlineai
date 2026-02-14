-- ═══════════════════════════════════════════════════════════════
-- INTEGRAÇÃO: Site/Landing Page ↔ Hub Marketing
-- ═══════════════════════════════════════════════════════════════

-- 1. Adicionar campos UTM nos deals para rastreamento de origem
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS landing_page_url TEXT;

-- 2. Tabela web_events: Registro granular de eventos do site
CREATE TABLE IF NOT EXISTS public.web_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN ('pageview', 'form_submit', 'cta_click', 'lead_capture', 'demo_request')),
    page_url TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    visitor_id TEXT,  -- anonymous ID via cookie/fingerprint
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.web_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "web_events_public_insert" ON public.web_events FOR INSERT WITH CHECK (true);
CREATE POLICY "web_events_public_read" ON public.web_events FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_web_events_type ON public.web_events(event_type);
CREATE INDEX IF NOT EXISTS idx_web_events_created ON public.web_events(created_at);
CREATE INDEX IF NOT EXISTS idx_web_events_utm ON public.web_events(utm_source, utm_medium, utm_campaign);

-- 3. Tabela lead_captures: Leads capturados via site/landing page
CREATE TABLE IF NOT EXISTS public.lead_captures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    message TEXT,
    form_source TEXT NOT NULL DEFAULT 'website', -- 'website', 'landing_page', 'chatbot', 'whatsapp'
    page_url TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    referrer TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'discarded')),
    deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lead_captures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_captures_public" ON public.lead_captures FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_lead_captures_status ON public.lead_captures(status);
CREATE INDEX IF NOT EXISTS idx_lead_captures_email ON public.lead_captures(email);
CREATE INDEX IF NOT EXISTS idx_lead_captures_created ON public.lead_captures(created_at);

-- 4. Função: Recalcular funil marketing_stats a partir dos deals reais
CREATE OR REPLACE FUNCTION public.recalc_marketing_funnel()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    current_month DATE := date_trunc('month', now())::date;
    v_visitors INTEGER;
    v_leads INTEGER;
    v_mql INTEGER;
    v_sql INTEGER;
    v_opportunities INTEGER;
    v_customers INTEGER;
    v_channel_perf JSONB;
BEGIN
    -- Visitantes: contar pageviews únicos do mês
    SELECT COALESCE(COUNT(DISTINCT visitor_id), 0) INTO v_visitors
    FROM public.web_events 
    WHERE event_type = 'pageview' 
    AND created_at >= current_month;

    -- Leads: total de deals com stage 'lead' ou que passaram por lead no mês
    SELECT COUNT(*) INTO v_leads
    FROM public.deals 
    WHERE created_at >= current_month;

    -- MQL (Marketing Qualified Lead): deals qualificados ou adiante
    SELECT COUNT(*) INTO v_mql
    FROM public.deals 
    WHERE stage IN ('qualified', 'proposal', 'negotiation', 'closed_won')
    AND created_at >= current_month;

    -- SQL (Sales Qualified Lead): deals em proposta ou adiante
    SELECT COUNT(*) INTO v_sql
    FROM public.deals 
    WHERE stage IN ('proposal', 'negotiation', 'closed_won')
    AND created_at >= current_month;

    -- Oportunidades: deals em negociação ou ganhos
    SELECT COUNT(*) INTO v_opportunities
    FROM public.deals 
    WHERE stage IN ('negotiation', 'closed_won')
    AND created_at >= current_month;

    -- Clientes: deals ganhos no mês
    SELECT COUNT(*) INTO v_customers
    FROM public.deals 
    WHERE stage = 'closed_won'
    AND updated_at >= current_month;

    -- Performance por canal: baseado no source dos deals
    SELECT COALESCE(jsonb_agg(row_to_json(ch)::jsonb), '[]'::jsonb) INTO v_channel_perf
    FROM (
        SELECT 
            COALESCE(source, 'Direto') as channel,
            COUNT(*) as leads,
            COUNT(*) FILTER (WHERE stage = 'closed_won') as conversions,
            ROUND(
                CASE WHEN COUNT(*) > 0 
                THEN (COUNT(*) FILTER (WHERE stage = 'closed_won')::numeric / COUNT(*)::numeric * 100)
                ELSE 0 END, 1
            ) as conversao,
            COALESCE(SUM(value) FILTER (WHERE stage = 'closed_won'), 0) as revenue
        FROM public.deals
        WHERE created_at >= current_month
        GROUP BY COALESCE(source, 'Direto')
        ORDER BY COUNT(*) DESC
    ) ch;

    -- Upsert no marketing_stats
    INSERT INTO public.marketing_stats (month, visitors, leads, mql, sql, opportunities, customers, channel_performance)
    VALUES (current_month, v_visitors, v_leads, v_mql, v_sql, v_opportunities, v_customers, v_channel_perf)
    ON CONFLICT (month) 
    DO UPDATE SET
        visitors = GREATEST(EXCLUDED.visitors, public.marketing_stats.visitors),
        leads = EXCLUDED.leads,
        mql = EXCLUDED.mql,
        sql = EXCLUDED.sql,
        opportunities = EXCLUDED.opportunities,
        customers = EXCLUDED.customers,
        channel_performance = EXCLUDED.channel_performance;
END;
$$;

-- 5. Adicionar UNIQUE constraint no month para permitir ON CONFLICT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'marketing_stats_month_unique'
    ) THEN
        ALTER TABLE public.marketing_stats ADD CONSTRAINT marketing_stats_month_unique UNIQUE (month);
    END IF;
END $$;

-- 6. Trigger: Recalcular funil quando deals mudam de estágio
CREATE OR REPLACE FUNCTION public.trigger_recalc_funnel()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM public.recalc_marketing_funnel();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deals_recalc_funnel ON public.deals;
CREATE TRIGGER trg_deals_recalc_funnel
    AFTER INSERT OR UPDATE OF stage ON public.deals
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_recalc_funnel();

-- 7. Função: Criar deal automaticamente a partir de lead capture
CREATE OR REPLACE FUNCTION public.auto_create_deal_from_lead()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    new_deal_id UUID;
BEGIN
    -- Criar deal no pipeline
    INSERT INTO public.deals (
        title, company, contact_name, contact_email, 
        stage, priority, source,
        utm_source, utm_medium, utm_campaign, landing_page_url
    ) VALUES (
        COALESCE('Lead: ' || NEW.name, 'Lead: ' || NEW.email, 'Lead do Site'),
        NEW.company,
        NEW.name,
        NEW.email,
        'lead',
        'warm',
        COALESCE(NEW.utm_source, NEW.form_source, 'Website'),
        NEW.utm_source,
        NEW.utm_medium,
        NEW.utm_campaign,
        NEW.page_url
    )
    RETURNING id INTO new_deal_id;

    -- Atualizar lead_capture com o deal_id
    UPDATE public.lead_captures SET deal_id = new_deal_id WHERE id = NEW.id;

    -- Registrar atividade no deal
    INSERT INTO public.deal_activities (deal_id, type, title, description)
    VALUES (
        new_deal_id,
        'note',
        'Lead capturado via ' || COALESCE(NEW.form_source, 'site'),
        'Origem: ' || COALESCE(NEW.utm_source, 'direto') || 
        ' | Página: ' || COALESCE(NEW.page_url, 'N/A') ||
        CASE WHEN NEW.message IS NOT NULL THEN ' | Mensagem: ' || NEW.message ELSE '' END
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_capture_create_deal ON public.lead_captures;
CREATE TRIGGER trg_lead_capture_create_deal
    AFTER INSERT ON public.lead_captures
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_create_deal_from_lead();
