-- Seed Plans
insert into public.plans (name, description, price_monthly, price_yearly, features, limits) values
('Basic', 'Para pequenas equipes', 990, 9900, '["Até 5 usuários", "Suporte por email"]', '{"users": 5}'),
('Pro', 'Para equipes em crescimento', 2990, 29900, '["Até 20 usuários", "Suporte prioritário"]', '{"users": 20}'),
('Enterprise', 'Para grandes organizações', 9900, 99000, '["Usuários ilimitados", "Suporte 24/7"]', '{"users": "unlimited"}')
ON CONFLICT DO NOTHING;

-- Seed Financial Metrics
insert into public.financial_metrics (month, mrr, arr, revenue, expenses, churn_rate) values
('2023-07-01', 110000, 1320000, 285000, 248000, 2.8),
('2023-08-01', 115000, 1380000, 295000, 252000, 2.5),
('2023-09-01', 118000, 1416000, 305000, 255000, 3.1),
('2023-10-01', 121000, 1452000, 320000, 258000, 2.9),
('2023-11-01', 123000, 1476000, 335000, 260000, 2.4),
('2023-12-01', 123500, 1482000, 348000, 262000, 2.2),
('2024-01-01', 124000, 1488000, 358000, 257800, 2.1)
ON CONFLICT DO NOTHING;

-- Seed Transactions
insert into public.transactions (date, description, type, category, amount, status) values
('2024-01-28', 'Recebimento - Tech Solutions', 'income', 'MRR', 4500, 'completed'),
('2024-01-26', 'Folha de Pagamento', 'expense', 'Pessoal', 85000, 'completed'),
('2024-01-25', 'AWS Cloud', 'expense', 'Infraestrutura', 8000, 'completed'),
('2024-01-23', 'Anthropic API', 'expense', 'API', 14200, 'completed'),
('2024-01-22', 'Aluguel Escritório', 'expense', 'Operacional', 8500, 'completed'),
('2024-01-21', 'Google Ads', 'expense', 'Marketing', 12000, 'completed')
ON CONFLICT DO NOTHING;

-- Seed Fixed Costs
insert into public.fixed_costs (month, category, budgeted, actual) values
('2024-01-01', 'Pessoal', 170000, 168800),
('2024-01-01', 'Marketing', 45000, 48000),
('2024-01-01', 'Infraestrutura', 30000, 31200),
('2024-01-01', 'Operacional', 15000, 13800)
ON CONFLICT DO NOTHING;

-- Seed Variable Costs
insert into public.variable_costs (month, category, amount) values
('2024-01-01', 'APIs de IA', 23000),
('2024-01-01', 'Cloud', 20700),
('2024-01-01', 'Gateway', 11500)
ON CONFLICT DO NOTHING;

-- Seed Marketing Stats
insert into public.marketing_stats (month, visitors, leads, opportunities, customers, channel_performance) values
('2024-01-01', 15000, 2250, 170, 42, '[{"channel": "Google Ads", "leads": 520, "cpl": 45, "roi": 285}, {"channel": "Orgânico/SEO", "leads": 850, "cpl": 12, "roi": 620}]')
ON CONFLICT DO NOTHING;
