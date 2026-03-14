-- Phase 1 Critical Fix C1: Add is_auto_generated column to track system-generated taxes
-- Purpose: Allow idempotent tax generation and prevent duplicates

ALTER TABLE public.variable_costs
  ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.variable_costs.is_auto_generated IS
  'TRUE for tax entries generated automatically by the system. Never set by users. Used to prevent duplicate tax generation and identify auto-generated records.';

-- Create unique index to prevent duplicate tax entries for the same month
CREATE UNIQUE INDEX IF NOT EXISTS variable_costs_auto_generated_month_idx
  ON public.variable_costs (month)
  WHERE is_auto_generated = TRUE AND category = 'Impostos';
