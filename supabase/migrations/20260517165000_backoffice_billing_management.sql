-- Backoffice billing management layer.
-- These tables live in the financial Supabase project and store managerial/forecast data.
-- They should not be applied to the operational FirstLine product database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.backoffice_next_billing_date(
    anchor_date date,
    cycle text,
    from_date date DEFAULT CURRENT_DATE
)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    months_to_add integer;
    candidate date;
    target_month date;
    anchor_day integer;
    last_day integer;
BEGIN
    IF anchor_date IS NULL OR cycle IS NULL OR cycle IN ('trial', 'manual', 'none') THEN
        RETURN NULL;
    END IF;

    IF cycle = 'monthly' THEN
        months_to_add := GREATEST(
            0,
            ((EXTRACT(YEAR FROM age(date_trunc('month', from_date), date_trunc('month', anchor_date)))::int * 12)
             + EXTRACT(MONTH FROM age(date_trunc('month', from_date), date_trunc('month', anchor_date)))::int)
        );
    ELSIF cycle = 'yearly' THEN
        months_to_add := GREATEST(
            0,
            CEIL((
                (EXTRACT(YEAR FROM age(date_trunc('month', from_date), date_trunc('month', anchor_date)))::int * 12)
                + EXTRACT(MONTH FROM age(date_trunc('month', from_date), date_trunc('month', anchor_date)))::int
            ) / 12.0)::int * 12
        );
    ELSE
        RETURN NULL;
    END IF;

    anchor_day := EXTRACT(DAY FROM anchor_date)::int;

    LOOP
        target_month := date_trunc('month', anchor_date + (months_to_add || ' months')::interval)::date;
        last_day := EXTRACT(DAY FROM (target_month + interval '1 month - 1 day'))::int;
        candidate := target_month + (LEAST(anchor_day, last_day) - 1);

        IF candidate >= from_date THEN
            RETURN candidate;
        END IF;

        IF cycle = 'monthly' THEN
            months_to_add := months_to_add + 1;
        ELSE
            months_to_add := months_to_add + 12;
        END IF;
    END LOOP;
END;
$$;

CREATE TABLE IF NOT EXISTS public.backoffice_company_billing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firstline_company_id uuid NOT NULL UNIQUE,
    firstline_subscription_id uuid,
    firstline_company_name text,

    plan_name text NOT NULL,
    billing_cycle text NOT NULL DEFAULT 'monthly'
        CHECK (billing_cycle IN ('monthly', 'yearly', 'trial', 'manual', 'none')),
    billing_source text NOT NULL DEFAULT 'manual'
        CHECK (billing_source IN ('manual', 'stripe', 'imported')),

    contracted_seats integer NOT NULL DEFAULT 1 CHECK (contracted_seats >= 0),
    active_users_count_cached integer CHECK (active_users_count_cached IS NULL OR active_users_count_cached >= 0),
    unit_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),

    discount_type text NOT NULL DEFAULT 'none'
        CHECK (discount_type IN ('none', 'percent', 'fixed_amount', 'custom')),
    discount_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
    discount_reason text,
    discount_expires_at date,

    gross_period_amount numeric(12,2) GENERATED ALWAYS AS (
        ROUND((contracted_seats::numeric * unit_price), 2)
    ) STORED,
    expected_period_amount numeric(12,2) GENERATED ALWAYS AS (
        ROUND(GREATEST(
            0,
            CASE
                WHEN discount_type = 'percent' THEN (contracted_seats::numeric * unit_price) * (1 - LEAST(discount_value, 100) / 100)
                WHEN discount_type = 'fixed_amount' THEN (contracted_seats::numeric * unit_price) - discount_value
                ELSE contracted_seats::numeric * unit_price
            END
        ), 2)
    ) STORED,
    expected_mrr numeric(12,2) GENERATED ALWAYS AS (
        ROUND(
            CASE
                WHEN billing_cycle = 'monthly' THEN GREATEST(
                    0,
                    CASE
                        WHEN discount_type = 'percent' THEN (contracted_seats::numeric * unit_price) * (1 - LEAST(discount_value, 100) / 100)
                        WHEN discount_type = 'fixed_amount' THEN (contracted_seats::numeric * unit_price) - discount_value
                        ELSE contracted_seats::numeric * unit_price
                    END
                )
                WHEN billing_cycle = 'yearly' THEN GREATEST(
                    0,
                    CASE
                        WHEN discount_type = 'percent' THEN (contracted_seats::numeric * unit_price) * (1 - LEAST(discount_value, 100) / 100)
                        WHEN discount_type = 'fixed_amount' THEN (contracted_seats::numeric * unit_price) - discount_value
                        ELSE contracted_seats::numeric * unit_price
                    END
                ) / 12
                ELSE 0
            END,
            2
        )
    ) STORED,
    expected_arr numeric(12,2) GENERATED ALWAYS AS (
        ROUND(
            CASE
                WHEN billing_cycle = 'monthly' THEN GREATEST(
                    0,
                    CASE
                        WHEN discount_type = 'percent' THEN (contracted_seats::numeric * unit_price) * (1 - LEAST(discount_value, 100) / 100)
                        WHEN discount_type = 'fixed_amount' THEN (contracted_seats::numeric * unit_price) - discount_value
                        ELSE contracted_seats::numeric * unit_price
                    END
                ) * 12
                WHEN billing_cycle = 'yearly' THEN GREATEST(
                    0,
                    CASE
                        WHEN discount_type = 'percent' THEN (contracted_seats::numeric * unit_price) * (1 - LEAST(discount_value, 100) / 100)
                        WHEN discount_type = 'fixed_amount' THEN (contracted_seats::numeric * unit_price) - discount_value
                        ELSE contracted_seats::numeric * unit_price
                    END
                )
                ELSE 0
            END,
            2
        )
    ) STORED,

    start_date date,
    last_billing_date date,
    next_billing_date date,
    billing_anchor_day smallint CHECK (billing_anchor_day BETWEEN 1 AND 31),

    billing_health text NOT NULL DEFAULT 'not_configured'
        CHECK (billing_health IN ('ok', 'not_configured', 'trial', 'trial_expiring', 'due_soon', 'overdue', 'payment_failed', 'canceling', 'canceled', 'manual_review')),
    access_policy text NOT NULL DEFAULT 'manual_review'
        CHECK (access_policy IN ('active', 'trial_only', 'read_only', 'blocked', 'manual_review')),

    stripe_customer_id text,
    stripe_subscription_id text,
    stripe_price_id text,
    stripe_product_id text,
    stripe_last_invoice_id text,
    stripe_last_payment_status text,
    stripe_current_period_start timestamptz,
    stripe_current_period_end timestamptz,
    stripe_cancel_at_period_end boolean,

    notes text,
    created_by text,
    updated_by text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.backoffice_billing_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_id uuid REFERENCES public.backoffice_company_billing(id) ON DELETE CASCADE,
    firstline_company_id uuid,
    event_type text NOT NULL,
    event_source text NOT NULL DEFAULT 'manual'
        CHECK (event_source IN ('manual', 'system', 'stripe', 'imported')),
    amount numeric(12,2),
    currency text NOT NULL DEFAULT 'BRL',
    event_date timestamptz NOT NULL DEFAULT now(),
    description text,
    before_data jsonb,
    after_data jsonb,
    created_by text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.backoffice_stripe_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id text NOT NULL UNIQUE,
    event_type text NOT NULL,
    stripe_object_id text,
    firstline_company_id uuid,
    processing_status text NOT NULL DEFAULT 'pending'
        CHECK (processing_status IN ('pending', 'processed', 'ignored', 'failed')),
    processed_at timestamptz,
    error_message text,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backoffice_company_billing_company_id
    ON public.backoffice_company_billing (firstline_company_id);
CREATE INDEX IF NOT EXISTS idx_backoffice_company_billing_health
    ON public.backoffice_company_billing (billing_health);
CREATE INDEX IF NOT EXISTS idx_backoffice_company_billing_next_billing
    ON public.backoffice_company_billing (next_billing_date);
CREATE INDEX IF NOT EXISTS idx_backoffice_company_billing_stripe_customer
    ON public.backoffice_company_billing (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_backoffice_billing_events_company_date
    ON public.backoffice_billing_events (firstline_company_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_backoffice_billing_events_billing_date
    ON public.backoffice_billing_events (billing_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_backoffice_stripe_events_status
    ON public.backoffice_stripe_events (processing_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backoffice_stripe_events_object
    ON public.backoffice_stripe_events (stripe_object_id);

CREATE OR REPLACE FUNCTION public.set_backoffice_billing_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();

    IF NEW.start_date IS NOT NULL AND NEW.billing_anchor_day IS NULL THEN
        NEW.billing_anchor_day = EXTRACT(DAY FROM NEW.start_date)::smallint;
    END IF;

    IF NEW.next_billing_date IS NULL AND NEW.start_date IS NOT NULL THEN
        NEW.next_billing_date = public.backoffice_next_billing_date(NEW.start_date, NEW.billing_cycle, CURRENT_DATE);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_backoffice_company_billing_updated_at ON public.backoffice_company_billing;
CREATE TRIGGER trg_backoffice_company_billing_updated_at
BEFORE INSERT OR UPDATE ON public.backoffice_company_billing
FOR EACH ROW
EXECUTE FUNCTION public.set_backoffice_billing_updated_at();

ALTER TABLE public.backoffice_company_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backoffice_billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backoffice_stripe_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.backoffice_company_billing IS 'Managerial billing layer for FirstLine companies. Stored in financial Supabase, not in the FirstLine operational database.';
COMMENT ON TABLE public.backoffice_billing_events IS 'Manual/system/Stripe billing event history for backoffice audit and timeline.';
COMMENT ON TABLE public.backoffice_stripe_events IS 'Stripe webhook/event processing log for idempotency and troubleshooting.';
