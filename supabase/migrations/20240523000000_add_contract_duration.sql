-- Add contract_duration column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS contract_duration INTEGER DEFAULT 12;

COMMENT ON COLUMN public.clients.contract_duration IS 'Duração do contrato em meses';
