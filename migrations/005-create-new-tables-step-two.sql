create table countries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  code text,
  has_atr boolean default false,
  notes text,
  created_at timestamp with time zone default now()
);

create table company_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null default 0,
  period text not null default 'monthly',
  is_active boolean default true,
  notes text,
  created_at timestamp with time zone default now()
);

create table tax_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  tax_type text not null,
  rate numeric default 0,
  fixed_amount numeric default 0,
  period text default 'monthly',
  is_active boolean default true,
  notes text,
  created_at timestamp with time zone default now()
);

create table marketplace_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  marketplace text not null,
  default_commission_rate numeric default 0,
  default_shipping_cost numeric default 0,
  service_fee numeric default 0,
  payment_term_days integer default 28,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

alter table countries enable row level security;
alter table company_expenses enable row level security;
alter table tax_settings enable row level security;
alter table marketplace_settings enable row level security;

create policy "Users can manage own countries"
on countries for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own company expenses"
on company_expenses for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own tax settings"
on tax_settings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own marketplace settings"
on marketplace_settings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);