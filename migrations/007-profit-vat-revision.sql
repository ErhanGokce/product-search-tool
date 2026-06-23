alter table product_pool
add column if not exists purchase_price numeric,
add column if not exists purchase_price_includes_vat boolean not null default true,
add column if not exists purchase_vat_rate numeric not null default 20;

alter table marketplace_settings
add column if not exists commission_base text not null default 'gross_sale_price',
add column if not exists default_commission_includes_vat boolean not null default false,
add column if not exists default_commission_vat_rate numeric not null default 20,
add column if not exists service_fee_includes_vat boolean not null default false,
add column if not exists service_fee_vat_rate numeric not null default 20,
add column if not exists default_shipping_includes_vat boolean not null default false,
add column if not exists default_shipping_vat_rate numeric not null default 20;

alter table company_expenses
add column if not exists amount_includes_vat boolean not null default false,
add column if not exists vat_rate numeric not null default 20,
add column if not exists vat_deductible boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'marketplace_settings_commission_base_check'
  ) then
    alter table marketplace_settings
    add constraint marketplace_settings_commission_base_check
    check (commission_base in ('gross_sale_price', 'net_sale_price'));
  end if;
end;
$$;

create index if not exists product_pool_user_purchase_price_idx
on product_pool (user_id, purchase_price);

create index if not exists marketplace_settings_user_marketplace_idx
on marketplace_settings (user_id, marketplace);
