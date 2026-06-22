alter table product_categories
add column if not exists parent_id uuid references product_categories(id) on delete cascade,
add column if not exists vat_rate numeric,
add column if not exists excise_tax_rate numeric,
add column if not exists customs_duty_rate numeric,
add column if not exists additional_customs_duty_rate numeric,
add column if not exists trt_tax_rate numeric,
add column if not exists trendyol_commission_rate numeric,
add column if not exists hepsiburada_commission_rate numeric,
add column if not exists amazon_commission_rate numeric,
add column if not exists gtip_code text,
add column if not exists notes text;

drop index if exists product_categories_user_name_unique;

create unique index if not exists product_categories_user_parent_name_unique
on product_categories (user_id, parent_id, lower(name))
where parent_id is not null;

create unique index if not exists product_categories_user_root_name_unique
on product_categories (user_id, lower(name))
where parent_id is null;

insert into product_categories (
  id,
  user_id,
  name,
  parent_id,
  created_at,
  updated_at
)
select
  sub_categories.id,
  sub_categories.user_id,
  sub_categories.name,
  sub_categories.category_id,
  sub_categories.created_at,
  sub_categories.updated_at
from product_sub_categories as sub_categories
where not exists (
  select 1
  from product_categories as categories
  where categories.id = sub_categories.id
);

do $$
declare
  constraint_name text;
begin
  select con.conname
  into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
  join pg_class foreign_rel on foreign_rel.oid = con.confrelid
  where rel.relname = 'product_pool'
    and att.attname = 'sub_category_id'
    and foreign_rel.relname = 'product_sub_categories'
    and con.contype = 'f'
  limit 1;

  if constraint_name is not null then
    execute format('alter table product_pool drop constraint %I', constraint_name);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_pool_sub_category_id_product_categories_fkey'
  ) then
    alter table product_pool
    add constraint product_pool_sub_category_id_product_categories_fkey
    foreign key (sub_category_id)
    references product_categories(id)
    on delete set null;
  end if;
end;
$$;
