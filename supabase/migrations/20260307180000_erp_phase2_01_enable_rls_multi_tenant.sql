-- ==============================================================================
-- MIGRATION: 2026_ERP_PHASE2_01_ENABLE_RLS_MULTI_TENANT.sql
-- DESCRICAO: Transforma o SaaS Single-Tenant em Multi-Tenant via organization_id
-- ==============================================================================

-- 1. Criação da Tabela de Nível Superior: organizations (Tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela auxiliar: users_organizations (Quem pode acessar qual tenant)
CREATE TABLE IF NOT EXISTS public.users_organizations (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, organization_id)
);

-- 3. Injetando organization_id nas tabelas operacionais
-- Tabela: clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
-- Tabela: invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
-- Tabela: transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
-- Tabela: budget
ALTER TABLE public.budget ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
-- Tabela: fixed_costs
ALTER TABLE public.fixed_costs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
-- Tabela: variable_costs
ALTER TABLE public.variable_costs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 4. Criando um Tenant Default para os dados atuais (Migração do Legado)
-- Para não perder os 16 clientes que o CEO importou hoje, vamos atrelá-los à primeira organização.
DO $$ 
DECLARE
    default_org_id UUID;
BEGIN
    -- Cria organization default "First Line AI" se nao existir nenhuma
    IF NOT EXISTS (SELECT 1 FROM public.organizations) THEN
        INSERT INTO public.organizations (name) VALUES ('First Line AI') RETURNING id INTO default_org_id;
    ELSE
        SELECT id INTO default_org_id FROM public.organizations LIMIT 1;
    END IF;

    -- Atualiza os dados legacy
    UPDATE public.clients SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.invoices SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.transactions SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.budget SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.fixed_costs SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.variable_costs SET organization_id = default_org_id WHERE organization_id IS NULL;
END $$;

-- Define organization_id como NOT NULL agora que o legado foi resolvido
ALTER TABLE public.clients ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN organization_id SET NOT NULL;


-- ==============================================================================
-- 5. SEGURANÇA BÁSICA: ATIVAR RLS (ROW LEVEL SECURITY) E REMOVER "PUBLIC READ"
-- ==============================================================================

-- Remover accessos puramente anônimos / publicos (Dropando policies antigas se existirem)
-- Exemplo: DROP POLICY IF EXISTS "Disable RLS or allow all" ON public.clients;

-- Clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only read and write clients of their organization" 
ON public.clients FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid())
);

-- Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only read and write invoices of their organization" 
ON public.invoices FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid())
);

-- Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only read and write transactions of their organization" 
ON public.transactions FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid())
);

-- E as outras tabelas (serão integradas na etapa 2 via script consolidado).
