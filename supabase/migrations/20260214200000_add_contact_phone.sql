-- Add contact_phone column to deals table
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Update existing rows with a placeholder if needed (optional, skipping for now)
