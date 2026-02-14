-- Add priority/temperature and follow-up fields to deals
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('cold', 'warm', 'hot'));
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS next_followup_date DATE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS next_followup_type TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS lost_reason TEXT;

-- Deal Activities: Full history of interactions
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

-- Public access for now
ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deal_activities_public" ON public.deal_activities FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_deal_activities_deal ON public.deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_scheduled ON public.deal_activities(scheduled_at) WHERE is_completed = false;
