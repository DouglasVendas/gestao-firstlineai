-- Stripe purchases received before a FirstLine company exists.
-- This table is the intake queue for PLG purchases and account creation.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.backoffice_stripe_purchases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_checkout_session_id text UNIQUE,
    stripe_customer_id text,
    stripe_subscription_id text UNIQUE,
    stripe_payment_intent_id text,
    stripe_invoice_id text,

    firstline_company_id uuid,
    firstline_subscription_id uuid,
    plan_code text,
    plan_name text,
    billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly')),
    billing_model text NOT NULL DEFAULT 'per_seat',
    seat_quantity integer NOT NULL DEFAULT 1 CHECK (seat_quantity >= 1),

    amount_total numeric(12,2),
    currency text NOT NULL DEFAULT 'BRL',
    payment_status text,
    subscription_status text,
    current_period_start timestamptz,
    current_period_end timestamptz,

    company_name text,
    admin_name text,
    admin_email text,
    admin_phone text,
    tax_document text,

    account_creation_status text NOT NULL DEFAULT 'pending'
        CHECK (account_creation_status IN ('pending', 'created', 'linked', 'ignored', 'failed')),
    account_creation_error text,
    raw_checkout_session jsonb,
    raw_subscription jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_backoffice_stripe_purchases_status
    ON public.backoffice_stripe_purchases (account_creation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backoffice_stripe_purchases_customer
    ON public.backoffice_stripe_purchases (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_backoffice_stripe_purchases_company
    ON public.backoffice_stripe_purchases (firstline_company_id);
CREATE INDEX IF NOT EXISTS idx_backoffice_stripe_purchases_admin_email
    ON public.backoffice_stripe_purchases (lower(admin_email));

CREATE OR REPLACE FUNCTION public.set_backoffice_stripe_purchases_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_backoffice_stripe_purchases_updated_at ON public.backoffice_stripe_purchases;
CREATE TRIGGER trg_backoffice_stripe_purchases_updated_at
BEFORE UPDATE ON public.backoffice_stripe_purchases
FOR EACH ROW
EXECUTE FUNCTION public.set_backoffice_stripe_purchases_updated_at();

ALTER TABLE public.backoffice_stripe_purchases ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.backoffice_stripe_purchases IS 'PLG Stripe purchase intake queue for creating or linking FirstLine accounts.';
