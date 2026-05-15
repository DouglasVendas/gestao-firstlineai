-- Add short display names to fixed and variable costs. Description remains optional detail text.

ALTER TABLE public.fixed_costs
  ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.variable_costs
  ADD COLUMN IF NOT EXISTS name TEXT;

UPDATE public.fixed_costs
SET name = COALESCE(NULLIF(trim(name), ''), NULLIF(trim(description), ''), category)
WHERE name IS NULL OR trim(name) = '';

UPDATE public.variable_costs
SET name = COALESCE(NULLIF(trim(name), ''), NULLIF(trim(description), ''), category)
WHERE name IS NULL OR trim(name) = '';

ALTER TABLE public.fixed_costs
  ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.variable_costs
  ALTER COLUMN name SET NOT NULL;

CREATE INDEX IF NOT EXISTS fixed_costs_name_idx ON public.fixed_costs (name);
CREATE INDEX IF NOT EXISTS variable_costs_name_idx ON public.variable_costs (name);
