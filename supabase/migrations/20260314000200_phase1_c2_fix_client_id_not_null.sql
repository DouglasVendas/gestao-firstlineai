-- Phase 1 Critical Fix C2: Ensure all invoices have a client
-- Purpose: Make client_id NOT NULL and create a sentinel "Generic Client" for imported invoices

-- Step 1: Insert sentinel "Generic Client" with deterministic UUID
-- This client receives all orphaned invoices without a client mapping
DO $$
BEGIN
  INSERT INTO public.clients (id, name, status, mrr, organization_id)
  SELECT
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Cliente Genérico',
    'active',
    0,
    (SELECT id FROM public.organizations LIMIT 1)
  WHERE EXISTS (SELECT 1 FROM public.organizations)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN others THEN
  -- If organizations table is empty or other error, log but continue
  -- The constraint will be added below even if sentinel insert fails
  RAISE WARNING 'Could not insert generic client sentinel: %', SQLERRM;
END$$;

-- Step 2: Backfill any existing NULL client_id values with the sentinel client
UPDATE public.invoices
SET client_id = '00000000-0000-0000-0000-000000000001'
WHERE client_id IS NULL;

-- Step 3: Enforce NOT NULL constraint on client_id
ALTER TABLE public.invoices ALTER COLUMN client_id SET NOT NULL;

-- Step 4: Optional - Add comment to document the sentinel client
COMMENT ON TABLE public.clients IS
  'Clients table. Note: '00000000-0000-0000-0000-000000000001' is a system-generated sentinel "Generic Client" used for invoices without explicit client mapping.';
