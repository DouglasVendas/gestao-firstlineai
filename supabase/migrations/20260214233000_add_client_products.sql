-- Add products column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS products TEXT[] DEFAULT '{}';

-- Update existing clients to have 'CRM' as default product
UPDATE public.clients 
SET products = '{CRM}' 
WHERE products IS NULL OR products = '{}';
