create table if not exists profit_calculation_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null,
  product_name text not null,
  marketplace text not null,
  primary_scenario text not null default 'estimated',
  gross_sale_price numeric not null default 0,
  net_profit numeric not null default 0,
  net_margin numeric not null default 0,
  roi numeric not null default 0,
  status text not null,
  input_snapshot jsonb not null,
  scenarios_snapshot jsonb not null,
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint profit_snapshot_marketplace_check
    check (marketplace in ('Trendyol', 'Hepsiburada', 'Amazon')),
  constraint profit_snapshot_primary_scenario_check
    check (primary_scenario in ('normal', 'discounted', 'estimated')),
  constraint profit_snapshot_status_check
    check (status in ('Kârlı', 'Riskli', 'Zarar'))
);

create index if not exists profit_snapshots_user_created_at_idx
on profit_calculation_snapshots (user_id, created_at desc);

create index if not exists profit_snapshots_user_product_marketplace_idx
on profit_calculation_snapshots (user_id, product_id, marketplace, created_at desc);

alter table profit_calculation_snapshots enable row level security;

drop policy if exists "Users can view own profit snapshots"
on profit_calculation_snapshots;

create policy "Users can view own profit snapshots"
on profit_calculation_snapshots for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own profit snapshots"
on profit_calculation_snapshots;

create policy "Users can create own profit snapshots"
on profit_calculation_snapshots for insert
with check (auth.uid() = user_id);
