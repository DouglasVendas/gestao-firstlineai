-- Track actual payment date for variable costs.

ALTER TABLE public.variable_costs
  ADD COLUMN IF NOT EXISTS paid_at DATE;
