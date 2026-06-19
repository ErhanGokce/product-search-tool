create table if not exists product_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists product_categories_user_name_unique
on product_categories (user_id, lower(name));

alter table product_categories enable row level security;

drop policy if exists "Users can view own product categories"
on product_categories;

create policy "Users can view own product categories"
on product_categories for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own product categories"
on product_categories;

create policy "Users can insert own product categories"
on product_categories for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own product categories"
on product_categories;

create policy "Users can update own product categories"
on product_categories for update
using (auth.uid() = user_id);

drop policy if exists "Users can delete own product categories"
on product_categories;

create policy "Users can delete own product categories"
on product_categories for delete
using (auth.uid() = user_id);

create table if not exists product_sub_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references product_categories(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists product_sub_categories_user_category_name_unique
on product_sub_categories (user_id, category_id, lower(name));

alter table product_sub_categories enable row level security;

drop policy if exists "Users can view own product sub categories"
on product_sub_categories;

create policy "Users can view own product sub categories"
on product_sub_categories for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own product sub categories"
on product_sub_categories;

create policy "Users can insert own product sub categories"
on product_sub_categories for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own product sub categories"
on product_sub_categories;

create policy "Users can update own product sub categories"
on product_sub_categories for update
using (auth.uid() = user_id);

drop policy if exists "Users can delete own product sub categories"
on product_sub_categories;

create policy "Users can delete own product sub categories"
on product_sub_categories for delete
using (auth.uid() = user_id);

alter table product_pool
add column if not exists category_id uuid references product_categories(id) on delete set null,
add column if not exists sub_category_id uuid references product_sub_categories(id) on delete set null;
