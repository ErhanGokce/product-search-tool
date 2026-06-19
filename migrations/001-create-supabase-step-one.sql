create table product_pool (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,

  product_name text not null,
  marketplace text not null,
  category text,
  sub_category text,

  discounted_price numeric,
  normal_price numeric,

  rating_count integer default 0,
  review_count integer default 0,
  favorite_count integer default 0,
  seller_count integer default 0,

  is_suitable boolean default false,
  is_marketplace_seller boolean default false,
  has_big_seller boolean default false,

  notes text,

  created_at timestamp with time zone default now()
);

alter table product_pool enable row level security;

create policy "Users can view own product pool"
on product_pool for select
using (auth.uid() = user_id);

create policy "Users can insert own product pool"
on product_pool for insert
with check (auth.uid() = user_id);

create policy "Users can update own product pool"
on product_pool for update
using (auth.uid() = user_id);

create policy "Users can delete own product pool"
on product_pool for delete
using (auth.uid() = user_id);