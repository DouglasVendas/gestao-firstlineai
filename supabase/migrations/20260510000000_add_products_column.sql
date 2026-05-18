-- Add products column to clients table (TEXT array)
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS products TEXT[] DEFAULT '{}';
