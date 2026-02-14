-- Tags for deals
CREATE TABLE IF NOT EXISTS public.deal_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Many-to-many relationship between deals and tags
CREATE TABLE IF NOT EXISTS public.deal_tag_links (
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.deal_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (deal_id, tag_id)
);

-- Add plan link to deals for product-based pricing
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly'));

-- RLS
ALTER TABLE public.deal_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deal_tags_public" ON public.deal_tags FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE public.deal_tag_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deal_tag_links_public" ON public.deal_tag_links FOR ALL USING (true) WITH CHECK (true);

-- Seed some default tags
INSERT INTO public.deal_tags (name, color) VALUES
    ('Upsell', '#f59e0b'),
    ('Novo Cliente', '#22c55e'),
    ('Enterprise', '#6366f1'),
    ('Indicação', '#ec4899'),
    ('Renovação', '#14b8a6'),
    ('Urgente', '#ef4444')
ON CONFLICT (name) DO NOTHING;
