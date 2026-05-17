CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.internal_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    name text NOT NULL,
    role varchar(32) NOT NULL DEFAULT 'OPERATOR',
    status varchar(32) NOT NULL DEFAULT 'ACTIVE',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT internal_users_role_check CHECK (role IN ('OWNER', 'OPERATOR')),
    CONSTRAINT internal_users_status_check CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE IF NOT EXISTS public.backoffice_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_internal_user_id uuid REFERENCES public.internal_users(id),
    actor_email text,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    before_data jsonb,
    after_data jsonb,
    reason text,
    ip_address text,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_internal_users_email ON public.internal_users (lower(email));
CREATE INDEX IF NOT EXISTS idx_backoffice_audit_log_created_at ON public.backoffice_audit_log (created_at DESC);

ALTER TABLE public.internal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backoffice_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'company'
    ) THEN
        ALTER TABLE public.company ADD COLUMN IF NOT EXISTS account_status varchar(32) NOT NULL DEFAULT 'ACTIVE';
        CREATE INDEX IF NOT EXISTS idx_company_account_status ON public.company (account_status);
    END IF;
END $$;
