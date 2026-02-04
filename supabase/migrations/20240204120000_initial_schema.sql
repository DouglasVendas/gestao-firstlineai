-- Enable Row Level Security
alter table if exists public.plans enable row level security;
alter table if exists public.clients enable row level security;
alter table if exists public.financial_metrics enable row level security;
alter table if exists public.transactions enable row level security;
alter table if exists public.fixed_costs enable row level security;
alter table if exists public.variable_costs enable row level security;
alter table if exists public.marketing_stats enable row level security;
alter table if exists public.invoices enable row level security;

-- Create Types
do $$ 
begin
    if not exists (select 1 from pg_type where typname = 'transaction_type') then
        create type transaction_type as enum ('entrada', 'saida');
    end if;
    if not exists (select 1 from pg_type where typname = 'transaction_status') then
        create type transaction_status as enum ('pending', 'completed', 'cancelled');
    end if;
    if not exists (select 1 from pg_type where typname = 'client_status') then
        create type client_status as enum ('active', 'trial', 'churned', 'inactive');
    end if;
    if not exists (select 1 from pg_type where typname = 'invoice_status') then
        create type invoice_status as enum ('paid', 'pending', 'overdue');
    end if;
end $$;

-- Create Tables
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_monthly numeric not null,
  price_yearly numeric not null,
  features jsonb,
  limits jsonb,
  created_at timestamptz default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text,
  plan_id uuid references public.plans(id),
  mrr numeric default 0,
  arr numeric default 0,
  status client_status default 'active',
  start_date date default current_date,
  renewal_date date,
  health_score int default 100,
  payment_method text,
  created_at timestamptz default now()
);

create table if not exists public.financial_metrics (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  mrr numeric default 0,
  arr numeric default 0,
  revenue numeric default 0,
  expenses numeric default 0,
  churn_rate numeric default 0,
  customers_count int default 0,
  created_at timestamptz default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  description text not null,
  type transaction_type not null,
  category text,
  amount numeric not null,
  status transaction_status default 'completed',
  created_at timestamptz default now()
);

create table if not exists public.fixed_costs (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  category text not null,
  budgeted numeric default 0,
  actual numeric default 0,
  created_at timestamptz default now()
);

create table if not exists public.variable_costs (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  category text not null,
  amount numeric default 0,
  created_at timestamptz default now()
);

create table if not exists public.marketing_stats (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  visitors int default 0,
  leads int default 0,
  opportunities int default 0,
  customers int default 0,
  channel_data jsonb,
  created_at timestamptz default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id),
  amount numeric not null,
  due_date date not null,
  status invoice_status default 'pending',
  created_at timestamptz default now()
);

-- Create Policies (Idempotent)
do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Allow all access' and tablename = 'plans') then
        create policy "Allow all access" on public.plans for all using (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Allow all access' and tablename = 'clients') then
        create policy "Allow all access" on public.clients for all using (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Allow all access' and tablename = 'financial_metrics') then
        create policy "Allow all access" on public.financial_metrics for all using (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Allow all access' and tablename = 'transactions') then
        create policy "Allow all access" on public.transactions for all using (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Allow all access' and tablename = 'fixed_costs') then
        create policy "Allow all access" on public.fixed_costs for all using (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Allow all access' and tablename = 'variable_costs') then
        create policy "Allow all access" on public.variable_costs for all using (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Allow all access' and tablename = 'marketing_stats') then
        create policy "Allow all access" on public.marketing_stats for all using (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Allow all access' and tablename = 'invoices') then
        create policy "Allow all access" on public.invoices for all using (true);
    end if;
end $$;
