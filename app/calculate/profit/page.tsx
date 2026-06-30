import { redirect } from "next/navigation";

import type { ProductCategory, ProductPoolItem } from "@/components/product-pool/types";
import { ProfitCalculator } from "@/components/profit/profit-calculator";
import type {
  CompanyExpense,
  CountrySetting,
  MarketplaceSetting,
  TaxSetting,
} from "@/components/settings/types";
import type { ProfitSnapshot } from "@/lib/profit/types";
import { createClient } from "@/lib/supabase/server";

export default async function ProfitCalculationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    productsResult,
    categoriesResult,
    companyExpensesResult,
    marketplaceSettingsResult,
    taxSettingsResult,
    countriesResult,
    snapshotsResult,
  ] = await Promise.all([
    supabase
      .from("product_pool")
      .select(
        "id,user_id,product_name,product_url,marketplace,category_id,sub_category_id,category,sub_category,discounted_price,normal_price,purchase_price,purchase_price_includes_vat,purchase_vat_rate,rating_count,review_count,favorite_count,seller_count,is_suitable,is_marketplace_seller,has_big_seller,notes,created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("product_categories")
      .select(
        "id,user_id,name,parent_id,vat_rate,excise_tax_rate,customs_duty_rate,additional_customs_duty_rate,trt_tax_rate,trendyol_commission_rate,hepsiburada_commission_rate,amazon_commission_rate,gtip_code,notes,created_at,updated_at",
      )
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("company_expenses")
      .select("id,user_id,name,amount,amount_includes_vat,vat_rate,vat_deductible,period,is_active,notes,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("marketplace_settings")
      .select(
        "id,user_id,marketplace,default_commission_rate,commission_base,default_commission_includes_vat,default_commission_vat_rate,default_shipping_cost,default_shipping_includes_vat,default_shipping_vat_rate,service_fee,service_fee_includes_vat,service_fee_vat_rate,payment_term_days,is_active,created_at",
      )
      .eq("user_id", user.id)
      .order("marketplace", { ascending: true }),
    supabase
      .from("tax_settings")
      .select(
        "id,user_id,name,tax_type,rate,fixed_amount,period,is_active,notes,created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("countries")
      .select("id,user_id,name,code,has_atr,notes,created_at")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("profit_calculation_snapshots")
      .select(
        "id,user_id,product_id,product_name,marketplace,primary_scenario,gross_sale_price,net_profit,net_margin,roi,status,input_snapshot,scenarios_snapshot,warnings,created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (productsResult.error) {
    throw new Error(`Urunler yuklenemedi: ${productsResult.error.message}`);
  }

  if (categoriesResult.error) {
    throw new Error(`Kategoriler yuklenemedi: ${categoriesResult.error.message}`);
  }

  if (companyExpensesResult.error) {
    throw new Error(
      `Sirket giderleri yuklenemedi: ${companyExpensesResult.error.message}`,
    );
  }

  if (marketplaceSettingsResult.error) {
    throw new Error(
      `Pazaryeri ayarlari yuklenemedi: ${marketplaceSettingsResult.error.message}`,
    );
  }

  if (taxSettingsResult.error) {
    throw new Error(
      `Vergi ayarlari yuklenemedi: ${taxSettingsResult.error.message}`,
    );
  }

  if (countriesResult.error) {
    throw new Error(`Ulkeler yuklenemedi: ${countriesResult.error.message}`);
  }

  const snapshotStorageAvailable = !snapshotsResult.error;

  if (
    snapshotsResult.error &&
    snapshotsResult.error.code !== "PGRST205"
  ) {
    throw new Error(
      `Kar hesaplama gecmisi yuklenemedi: ${snapshotsResult.error.message}`,
    );
  }

  return (
    <div className="app-page">
      <section>
        <p className="app-page-eyebrow">Kâr analizi</p>
        <h2 className="app-page-title">
          Kâr Hesapla
        </h2>
        <p className="app-page-description max-w-3xl">
          Ürün havuzundaki ürünler için satış fiyatı, vergi, komisyon ve
          operasyon giderlerini birlikte değerlendirerek senaryo bazlı kâr
          marjı hesaplayın.
        </p>
      </section>
      <ProfitCalculator
        categories={(categoriesResult.data ?? []) as ProductCategory[]}
        companyExpenses={(companyExpensesResult.data ?? []) as CompanyExpense[]}
        countries={(countriesResult.data ?? []) as CountrySetting[]}
        marketplaceSettings={
          (marketplaceSettingsResult.data ?? []) as MarketplaceSetting[]
        }
        products={(productsResult.data ?? []) as ProductPoolItem[]}
        snapshots={(snapshotsResult.data ?? []) as unknown as ProfitSnapshot[]}
        snapshotStorageAvailable={snapshotStorageAvailable}
        taxSettings={(taxSettingsResult.data ?? []) as TaxSetting[]}
      />
    </div>
  );
}
