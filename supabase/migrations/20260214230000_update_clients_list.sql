-- 1. ADICIONAR COLUNAS FALTANTES
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' 
CHECK (billing_cycle IN ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'yearly'));

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS contract_duration INTEGER DEFAULT 12;

-- 2. ATUALIZAR CLIENTES (SUA LISTA)

-- Alisson Gonçalves: Churn em Fevereiro (paid Dec, Jan)
UPDATE public.clients 
SET status = 'churned', 
    churn_date = '2026-02-01', 
    churn_reason = 'Inadimplência',
    billing_cycle = 'monthly'
WHERE name ILIKE '%Alisson Gonçalves%';

-- 2. BFR: Active (paid Dec, Jan, Feb)
UPDATE public.clients 
SET status = 'active', billing_cycle = 'monthly'
WHERE name ILIKE '%BFR%';

-- 3. ASAS: Contrato anual, pagamento mensal
UPDATE public.clients 
SET billing_cycle = 'monthly', contract_duration = 12
WHERE name ILIKE '%Asas%';

-- 4. Daiane: Mensal
UPDATE public.clients 
SET billing_cycle = 'monthly'
WHERE name ILIKE '%Daiane%';

-- 5. Dener: Mensal
UPDATE public.clients 
SET billing_cycle = 'monthly'
WHERE name ILIKE '%Dener%';

-- 6. Elaine: Mensal (contrato anual?) -> "Elaine mensal contrato anual"
UPDATE public.clients 
SET billing_cycle = 'monthly', contract_duration = 12
WHERE name ILIKE '%Elaine%';

-- 7. Fabiano Brino: Trimestral
UPDATE public.clients 
SET billing_cycle = 'quarterly'
WHERE name ILIKE '%Fabiano Brino%';

-- 8. Fabio Costa: Anual (pago total)
UPDATE public.clients 
SET billing_cycle = 'yearly'
WHERE name ILIKE '%Fabio Costa%';

-- 9. Felipe Campos: Anual, pagamento mensal
UPDATE public.clients 
SET billing_cycle = 'monthly', contract_duration = 12
WHERE name ILIKE '%Felipe Campos%';

-- 10. Guilherme Sales: Mensal
UPDATE public.clients 
SET billing_cycle = 'monthly'
WHERE name ILIKE '%Guilherme Sales%';

-- 11. Juliana Anhaia: Mensal (Unificar duas)
-- First, find IDs (assuming we keep the most recent or one with more data, but here likely duplicate)
-- Strategy: Delete the one with less data or just one of them arbitrarily if identical, keep the one created first usually?
-- Let's just keep one.
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rnum
    FROM public.clients
    WHERE name ILIKE '%Juliana Anhaia%'
)
DELETE FROM public.clients
WHERE id IN (SELECT id FROM duplicates WHERE rnum > 1);

UPDATE public.clients 
SET billing_cycle = 'monthly'
WHERE name ILIKE '%Juliana Anhaia%';

-- 12. Mosko Digital: Bimestral
UPDATE public.clients 
SET billing_cycle = 'bimonthly'
WHERE name ILIKE '%Mosko%';

-- 13. Rodrigo Real: Anual, pagamento mensal
UPDATE public.clients 
SET billing_cycle = 'monthly', contract_duration = 12
WHERE name ILIKE '%Rodrigo Real%';

-- 14. Virtux: Mensal, pediu pra cancelar esse mes (Fevereiro)
UPDATE public.clients 
SET status = 'churned', 
    churn_date = '2026-02-28', -- End of Feb
    churn_reason = 'Solicitação do Cliente',
    billing_cycle = 'monthly'
WHERE name ILIKE '%Virtux%';

-- 15. Vitoria Pontin: Anual mas pagamento mensal
UPDATE public.clients 
SET billing_cycle = 'monthly', contract_duration = 12
WHERE name ILIKE '%Vitoria Pontin%';
