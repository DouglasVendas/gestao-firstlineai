-- Create financial_metrics table
CREATE TABLE public.financial_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE NOT NULL,
  mrr NUMERIC NOT NULL DEFAULT 0,
  arr NUMERIC NOT NULL DEFAULT 0,
  churn_rate NUMERIC NOT NULL DEFAULT 0,
  new_mrr NUMERIC DEFAULT 0,
  expansion_mrr NUMERIC DEFAULT 0,
  contraction_mrr NUMERIC DEFAULT 0,
  churned_mrr NUMERIC DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  expenses NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plans table
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  plan_id UUID REFERENCES public.plans(id),
  mrr NUMERIC NOT NULL DEFAULT 0,
  start_date DATE,
  churn_date DATE,
  churn_reason TEXT,
  voluntary BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  value NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL,
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fixed_costs table
CREATE TABLE public.fixed_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT,
  actual NUMERIC NOT NULL DEFAULT 0,
  budgeted NUMERIC DEFAULT 0,
  month DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create variable_costs table
CREATE TABLE public.variable_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  month DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'expense',
  status TEXT NOT NULL DEFAULT 'pending',
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketing_stats table
CREATE TABLE public.marketing_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE NOT NULL,
  visitors INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  mql INTEGER DEFAULT 0,
  sql INTEGER DEFAULT 0,
  opportunities INTEGER DEFAULT 0,
  customers INTEGER DEFAULT 0,
  channel_performance JSONB DEFAULT '[]'::jsonb,
  campaign_roi JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budget table
CREATE TABLE public.budget (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  budgeted NUMERIC NOT NULL DEFAULT 0,
  actual NUMERIC NOT NULL DEFAULT 0,
  month DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (public read for now since no auth)
ALTER TABLE public.financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variable_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget ENABLE ROW LEVEL SECURITY;

-- Create public read policies (temporary until auth is added)
CREATE POLICY "Allow public read" ON public.financial_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.fixed_costs FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.variable_costs FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.marketing_stats FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.budget FOR SELECT USING (true);

-- Insert seed data for plans
INSERT INTO public.plans (name, description, price_monthly, price_yearly, features, limits) VALUES
('Starter', 'Para pequenas empresas começando', 99, 990, '["Dashboard básico", "5 usuários", "Suporte por email"]', '{"users": 5, "storage": "1GB", "apiCalls": 1000}'),
('Professional', 'Para empresas em crescimento', 299, 2990, '["Dashboard completo", "20 usuários", "Suporte prioritário", "Integrações"]', '{"users": 20, "storage": "10GB", "apiCalls": 10000}'),
('Enterprise', 'Para grandes organizações', 799, 7990, '["Recursos ilimitados", "Usuários ilimitados", "Suporte 24/7", "API dedicada", "SLA garantido"]', '{"users": "unlimited", "storage": "100GB", "apiCalls": "unlimited"}'),
('Custom', 'Solução personalizada', 1500, 15000, '["Tudo do Enterprise", "Desenvolvimento customizado", "Gerente de conta dedicado"]', '{"users": "unlimited", "storage": "unlimited", "apiCalls": "unlimited"}');

-- Insert seed data for financial_metrics (last 12 months)
INSERT INTO public.financial_metrics (month, mrr, arr, churn_rate, new_mrr, expansion_mrr, contraction_mrr, churned_mrr, revenue, expenses) VALUES
('2024-02-01', 85000, 1020000, 2.1, 8500, 3200, 1100, 2500, 95000, 62000),
('2024-03-01', 92000, 1104000, 1.8, 9200, 4100, 900, 2200, 102000, 65000),
('2024-04-01', 98000, 1176000, 2.3, 8800, 3800, 1200, 2800, 108000, 68000),
('2024-05-01', 105000, 1260000, 1.5, 10500, 4500, 800, 1900, 115000, 72000),
('2024-06-01', 112000, 1344000, 1.9, 11200, 5200, 1000, 2600, 122000, 75000),
('2024-07-01', 118000, 1416000, 2.0, 10800, 4800, 1100, 2700, 128000, 78000),
('2024-08-01', 125000, 1500000, 1.7, 11500, 5500, 900, 2400, 135000, 82000),
('2024-09-01', 132000, 1584000, 1.4, 12200, 6000, 700, 2100, 142000, 85000),
('2024-10-01', 140000, 1680000, 1.6, 13000, 6500, 850, 2350, 150000, 88000),
('2024-11-01', 148000, 1776000, 1.3, 13500, 7000, 600, 1950, 158000, 92000),
('2024-12-01', 156000, 1872000, 1.5, 14200, 7500, 750, 2200, 166000, 95000),
('2025-01-01', 165000, 1980000, 1.2, 15000, 8000, 500, 1800, 175000, 98000);

-- Insert seed clients
INSERT INTO public.clients (name, email, status, mrr, start_date) VALUES
('Tech Solutions Ltda', 'contato@techsolutions.com', 'active', 2500, '2023-06-15'),
('Startup Digital', 'admin@startupdigital.com', 'active', 1800, '2023-08-20'),
('Commerce Plus', 'financeiro@commerceplus.com', 'active', 3200, '2023-04-10'),
('Data Analytics Corp', 'suporte@dataanalytics.com', 'active', 4500, '2023-02-01'),
('Cloud Services Inc', 'contato@cloudservices.com', 'active', 2100, '2023-09-05'),
('Marketing Pro', 'admin@marketingpro.com', 'churned', 1500, '2023-03-15'),
('Fintech Solutions', 'contato@fintechsol.com', 'active', 5800, '2023-01-20'),
('E-commerce Hub', 'suporte@ecommercehub.com', 'active', 2800, '2023-07-12');

-- Insert seed invoices
INSERT INTO public.invoices (client_id, value, status, due_date) 
SELECT id, mrr, 'paid', '2025-01-15' FROM public.clients WHERE status = 'active' LIMIT 5;

INSERT INTO public.invoices (client_id, value, status, due_date) 
SELECT id, mrr, 'pending', '2025-02-15' FROM public.clients WHERE status = 'active';

INSERT INTO public.invoices (client_id, value, status, due_date) 
SELECT id, mrr * 0.8, 'overdue', '2025-01-01' FROM public.clients WHERE status = 'active' LIMIT 2;

-- Insert seed fixed costs
INSERT INTO public.fixed_costs (category, description, actual, budgeted, month) VALUES
('Pessoal', 'Salários e benefícios', 45000, 42000, '2025-01-01'),
('Infraestrutura', 'Servidores e cloud', 8500, 8000, '2025-01-01'),
('Marketing', 'Campanhas e ads', 12000, 15000, '2025-01-01'),
('Operacional', 'Escritório e utilities', 5500, 5000, '2025-01-01'),
('Software', 'Ferramentas e licenças', 3200, 3000, '2025-01-01');

-- Insert seed variable costs
INSERT INTO public.variable_costs (category, description, amount, month) VALUES
('Comissões', 'Comissões de vendas', 8500, '2025-01-01'),
('Hosting', 'Custos de infraestrutura variável', 2300, '2025-01-01'),
('Suporte', 'Terceirização de suporte', 1800, '2025-01-01');

-- Insert seed transactions
INSERT INTO public.transactions (description, category, amount, type, status, date) VALUES
('Receita MRR Janeiro', 'Receita', 165000, 'income', 'completed', '2025-01-31'),
('Salários Janeiro', 'Pessoal', 45000, 'expense', 'completed', '2025-01-05'),
('AWS Hosting', 'Infraestrutura', 8500, 'expense', 'completed', '2025-01-10'),
('Google Ads', 'Marketing', 6000, 'expense', 'completed', '2025-01-15'),
('Comissões Vendas', 'Comissões', 8500, 'expense', 'pending', '2025-02-05');

-- Insert seed marketing stats
INSERT INTO public.marketing_stats (month, visitors, leads, mql, sql, opportunities, customers, channel_performance, campaign_roi) VALUES
('2025-01-01', 45000, 2800, 1400, 560, 280, 42, 
 '[{"channel": "Google Ads", "spend": 6000, "leads": 800}, {"channel": "LinkedIn", "spend": 4000, "leads": 600}]',
 '[{"campaign": "Product Launch", "roi": 3.2}, {"campaign": "Webinar", "roi": 4.5}]');

-- Insert seed budget
INSERT INTO public.budget (category, budgeted, actual, month) VALUES
('Pessoal', 42000, 45000, '2025-01-01'),
('Infraestrutura', 8000, 8500, '2025-01-01'),
('Marketing', 15000, 12000, '2025-01-01'),
('Operacional', 5000, 5500, '2025-01-01'),
('Software', 3000, 3200, '2025-01-01');