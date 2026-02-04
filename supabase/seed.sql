-- Seed Plans
insert into public.plans (name, description, price_monthly, price_yearly, features, limits) values
('Basic', 'Para pequenas equipes começando', 990, 9900, '["Até 5 usuários", "10GB de armazenamento", "Suporte por email", "API básica"]', '{"users": 5, "storage": "10GB", "apiCalls": 10000}'),
('Pro', 'Para equipes em crescimento', 2990, 29900, '["Até 20 usuários", "50GB de armazenamento", "Suporte prioritário", "API completa", "Integrações avançadas", "Relatórios personalizados"]', '{"users": 20, "storage": "50GB", "apiCalls": 100000}'),
('Enterprise', 'Para grandes organizações', 9900, 99000, '["Usuários ilimitados", "Armazenamento ilimitado", "Suporte 24/7 dedicado", "API ilimitada", "SSO & SAML", "SLA garantido", "Gerente de conta dedicado"]', '{"users": "unlimited", "storage": "Ilimitado", "apiCalls": "unlimited"}');

-- Seed Clients
do $$
declare
  basic_id uuid;
  pro_id uuid;
  ent_id uuid;
begin
  select id into basic_id from public.plans where name = 'Basic';
  select id into pro_id from public.plans where name = 'Pro';
  select id into ent_id from public.plans where name = 'Enterprise';

  insert into public.clients (name, cnpj, plan_id, mrr, arr, status, start_date, renewal_date, health_score, payment_method) values
  ('TechCorp Brasil', '12.345.678/0001-90', ent_id, 12500, 150000, 'active', '2023-03-15', '2024-03-15', 92, 'Cartão'),
  ('Startup Inovação', '98.765.432/0001-10', pro_id, 2990, 35880, 'active', '2023-06-01', '2024-06-01', 78, 'Boleto'),
  ('Consultoria ABC', '11.222.333/0001-44', pro_id, 2990, 35880, 'trial', '2024-01-05', null, 65, null),
  ('E-commerce Plus', '55.666.777/0001-88', ent_id, 8900, 106800, 'active', '2023-01-10', '2024-01-10', 88, 'PIX'),
  ('Agência Digital', '33.444.555/0001-66', basic_id, 0, 0, 'churned', '2023-08-20', null, 15, 'Boleto'),
  ('Fintech Solutions', '77.888.999/0001-22', ent_id, 15000, 180000, 'active', '2022-11-01', '2024-11-01', 95, 'Cartão'),
  ('LogTech Brasil', '44.555.666/0001-77', pro_id, 4990, 59880, 'active', '2023-09-15', '2024-09-15', 82, 'PIX');
end $$;

-- Seed Financial Metrics
insert into public.financial_metrics (month, mrr, arr, revenue, expenses, churn_rate, customers_count) values
('2023-07-01', 110000, 1320000, 285000, 248000, 2.8, 140),
('2023-08-01', 115000, 1380000, 295000, 252000, 2.5, 150),
('2023-09-01', 118000, 1416000, 305000, 255000, 3.1, 158),
('2023-10-01', 121000, 1452000, 320000, 258000, 2.9, 165),
('2023-11-01', 123000, 1476000, 335000, 260000, 2.4, 175),
('2023-12-01', 123500, 1482000, 348000, 262000, 2.2, 180),
('2024-01-01', 124000, 1488000, 358000, 257800, 2.1, 186);

-- Seed Transactions
insert into public.transactions (date, description, type, category, amount) values
('2024-01-28', 'Recebimento - Tech Solutions', 'entrada', 'MRR', 4500),
('2024-01-27', 'Recebimento - Digital Corp', 'entrada', 'MRR', 4500),
('2024-01-26', 'Folha de Pagamento', 'saida', 'Pessoal', 85000),
('2024-01-25', 'AWS Cloud', 'saida', 'Infraestrutura', 8000),
('2024-01-24', 'Recebimento - Fintech Brasil', 'entrada', 'MRR', 4500),
('2024-01-23', 'Anthropic API', 'saida', 'API', 14200),
('2024-01-22', 'Aluguel Escritório', 'saida', 'Operacional', 8500),
('2024-01-21', 'Google Ads', 'saida', 'Marketing', 12000);

-- Seed Fixed Costs
insert into public.fixed_costs (month, category, budgeted, actual) values
('2024-01-01', 'Pessoal', 170000, 168800),
('2024-01-01', 'Marketing', 45000, 48000),
('2024-01-01', 'Infraestrutura', 30000, 31200),
('2024-01-01', 'Operacional', 15000, 13800);

-- Seed Variable Costs
insert into public.variable_costs (month, category, amount) values
('2024-01-01', 'APIs de IA', 23000),
('2024-01-01', 'Cloud', 20700),
('2024-01-01', 'Gateway', 11500);

-- Seed Marketing Stats
insert into public.marketing_stats (month, visitors, leads, opportunities, customers, channel_data) values
('2024-01-01', 15000, 2250, 170, 42, '[{"channel": "Google Ads", "leads": 520, "cpl": 45, "roi": 285}, {"channel": "LinkedIn Ads", "leads": 280, "cpl": 85, "roi": 180}, {"channel": "Orgânico/SEO", "leads": 850, "cpl": 12, "roi": 620}, {"channel": "Indicação", "leads": 380, "cpl": 0, "roi": 950}]');
