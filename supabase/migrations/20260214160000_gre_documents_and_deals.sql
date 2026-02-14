-- GRE Documents: Stores user-edited content for each GRE module
CREATE TABLE IF NOT EXISTS public.gre_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Deals Pipeline: Stores commercial deals/opportunities
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT,
    contact_name TEXT,
    contact_email TEXT,
    value NUMERIC DEFAULT 0,
    stage TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    notes TEXT,
    expected_close_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Public read/write for now (no auth yet)
ALTER TABLE public.gre_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gre_documents_public" ON public.gre_documents FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deals_public" ON public.deals FOR ALL USING (true) WITH CHECK (true);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_gre_documents_module ON public.gre_documents(module_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);
