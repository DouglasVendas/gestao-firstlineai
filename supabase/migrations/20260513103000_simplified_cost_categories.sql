-- Simplified SaaS B2B cost categories used by fixed and variable costs.

UPDATE public.fixed_costs
SET category = CASE
  WHEN lower(category) = 'pessoal' THEN 'Pessoas'
  WHEN lower(category) IN ('infraestrutura', 'servidores', 'servidores (uso)', 'apis de ia', 'cloud') THEN 'Tecnologia e Produto'
  WHEN lower(category) IN ('marketing', 'comissão', 'comissao') THEN 'Comercial e Marketing'
  WHEN lower(category) = 'operacional' THEN 'Administrativo'
  WHEN lower(category) IN ('impostos', 'taxas', 'taxas pagamento', 'gateway', 'darf', 'simples nacional') THEN 'Impostos e Taxas'
  WHEN lower(category) = 'outros' THEN 'Outros'
  ELSE category
END;

UPDATE public.variable_costs
SET category = CASE
  WHEN lower(category) = 'pessoal' THEN 'Pessoas'
  WHEN lower(category) IN ('infraestrutura', 'servidores', 'servidores (uso)', 'apis de ia', 'cloud') THEN 'Tecnologia e Produto'
  WHEN lower(category) IN ('marketing', 'comissão', 'comissao') THEN 'Comercial e Marketing'
  WHEN lower(category) = 'operacional' THEN 'Administrativo'
  WHEN lower(category) IN ('impostos', 'taxas', 'taxas pagamento', 'gateway', 'darf', 'simples nacional') THEN 'Impostos e Taxas'
  WHEN lower(category) = 'outros' THEN 'Outros'
  ELSE category
END;

UPDATE public.transactions
SET category = CASE
  WHEN lower(category) = 'pessoal' THEN 'Pessoas'
  WHEN lower(category) IN ('infraestrutura', 'servidores', 'servidores (uso)', 'apis de ia', 'cloud') THEN 'Tecnologia e Produto'
  WHEN lower(category) IN ('marketing', 'comissão', 'comissao') THEN 'Comercial e Marketing'
  WHEN lower(category) = 'operacional' THEN 'Administrativo'
  WHEN lower(category) IN ('impostos', 'taxas', 'taxas pagamento', 'gateway', 'darf', 'simples nacional') THEN 'Impostos e Taxas'
  WHEN lower(category) = 'outros' THEN 'Outros'
  ELSE category
END
WHERE category IS NOT NULL;

UPDATE public.budget
SET category = CASE
  WHEN lower(category) = 'pessoal' THEN 'Pessoas'
  WHEN lower(category) IN ('infraestrutura', 'servidores', 'servidores (uso)', 'apis de ia', 'cloud') THEN 'Tecnologia e Produto'
  WHEN lower(category) IN ('marketing', 'comissão', 'comissao') THEN 'Comercial e Marketing'
  WHEN lower(category) = 'operacional' THEN 'Administrativo'
  WHEN lower(category) IN ('impostos', 'taxas', 'taxas pagamento', 'gateway', 'darf', 'simples nacional') THEN 'Impostos e Taxas'
  WHEN lower(category) = 'outros' THEN 'Outros'
  ELSE category
END;

WITH categories(name, type) AS (
  VALUES
    ('Tecnologia e Produto', 'both'),
    ('Comercial e Marketing', 'both'),
    ('Atendimento e Sucesso', 'both'),
    ('Administrativo', 'both'),
    ('Impostos e Taxas', 'both'),
    ('Pessoas', 'both'),
    ('Outros', 'both')
)
INSERT INTO public.expense_categories (name, type)
SELECT c.name, c.type
FROM categories c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.expense_categories ec
  WHERE lower(ec.name) = lower(c.name)
);
