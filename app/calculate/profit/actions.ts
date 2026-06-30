"use server";

import { revalidatePath } from "next/cache";

import type {
  Marketplace,
  ProductCategory,
  ProductPoolItem,
} from "@/components/product-pool/types";
import { marketplaces } from "@/components/product-pool/types";
import type {
  CompanyExpense,
  CountrySetting,
  MarketplaceSetting,
  TaxSetting,
} from "@/components/settings/types";
import {
  buildProfitAnalysis,
  getAutoEstimatedPrice,
  toProfitNumber,
} from "@/lib/profit/build-profit-analysis";
import type {
  ProfitCalculatorState,
  ProfitSnapshot,
  ProfitSnapshotInput,
  SaveProfitSnapshotResult,
} from "@/lib/profit/types";
import { createClient } from "@/lib/supabase/server";

const PROFIT_PATH = "/calculate/profit";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(
  value: Record<string, unknown>,
  key: keyof ProfitCalculatorState,
  fallback = "",
) {
  const candidate = value[key];

  return typeof candidate === "string" ? candidate.slice(0, 200) : fallback;
}

function getBoolean(
  value: Record<string, unknown>,
  key: keyof ProfitCalculatorState,
  fallback: boolean,
) {
  const candidate = value[key];

  return typeof candidate === "boolean" ? candidate : fallback;
}

function sanitizeCalculatorState(value: unknown): ProfitCalculatorState | null {
  if (!isRecord(value)) {
    return null;
  }

  const marketplace = value.marketplace;
  const selectedProductId = getString(value, "selectedProductId");

  if (
    !marketplaces.includes(marketplace as Marketplace) ||
    !UUID_PATTERN.test(selectedProductId)
  ) {
    return null;
  }

  return {
    applyAtrAdvantage: getBoolean(value, "applyAtrAdvantage", false),
    customsBaseInput: getString(value, "customsBaseInput"),
    customsBrokerInput: getString(value, "customsBrokerInput"),
    estimatedPriceInput: getString(value, "estimatedPriceInput"),
    existingAnnualProfitInput: getString(
      value,
      "existingAnnualProfitInput",
      "0",
    ),
    freightInput: getString(value, "freightInput"),
    importExpenseIncludesVat: getBoolean(
      value,
      "importExpenseIncludesVat",
      true,
    ),
    importExpenseVatDeductible: getBoolean(
      value,
      "importExpenseVatDeductible",
      true,
    ),
    importExpenseVatRateInput: getString(
      value,
      "importExpenseVatRateInput",
      "20",
    ),
    includeCompanyExpenses: getBoolean(
      value,
      "includeCompanyExpenses",
      true,
    ),
    includeIncomeTax: getBoolean(value, "includeIncomeTax", true),
    insuranceInput: getString(value, "insuranceInput"),
    isImported: getBoolean(value, "isImported", false),
    marketplace: marketplace as Marketplace,
    monthlySalesInput: getString(value, "monthlySalesInput", "100"),
    purchaseIncludesVat: getBoolean(value, "purchaseIncludesVat", true),
    purchasePriceInput: getString(value, "purchasePriceInput"),
    purchaseVatRateInput: getString(value, "purchaseVatRateInput", "20"),
    selectedCountryId: getString(value, "selectedCountryId"),
    selectedProductId,
    shippingCostInput: getString(value, "shippingCostInput"),
    useProductPrice: getBoolean(value, "useProductPrice", true),
  };
}

function toJsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, candidate) =>
      typeof candidate === "number" && !Number.isFinite(candidate)
        ? 0
        : candidate,
    ),
  ) as T;
}

export async function saveProfitSnapshot(
  unsafeState: ProfitCalculatorState,
): Promise<SaveProfitSnapshotResult> {
  const state = sanitizeCalculatorState(unsafeState);

  if (!state) {
    return {
      error: "Hesaplama bilgileri geçersiz. Alanları kontrol edip tekrar deneyin.",
      ok: false,
    };
  }

  if (
    toProfitNumber(state.purchasePriceInput) <= 0 ||
    toProfitNumber(state.monthlySalesInput) <= 0
  ) {
    return {
      error: "Maliyet ve tahmini aylık satış adedi sıfırdan büyük olmalıdır.",
      ok: false,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: "Oturum bulunamadı. Lütfen yeniden giriş yapın.",
      ok: false,
    };
  }

  const [
    productResult,
    categoriesResult,
    companyExpensesResult,
    marketplaceSettingsResult,
    taxSettingsResult,
    countriesResult,
  ] = await Promise.all([
    supabase
      .from("product_pool")
      .select(
        "id,user_id,product_name,product_url,marketplace,category_id,sub_category_id,category,sub_category,discounted_price,normal_price,purchase_price,purchase_price_includes_vat,purchase_vat_rate,rating_count,review_count,favorite_count,seller_count,is_suitable,is_marketplace_seller,has_big_seller,notes,created_at",
      )
      .eq("id", state.selectedProductId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("product_categories")
      .select(
        "id,user_id,name,parent_id,vat_rate,excise_tax_rate,customs_duty_rate,additional_customs_duty_rate,trt_tax_rate,trendyol_commission_rate,hepsiburada_commission_rate,amazon_commission_rate,gtip_code,notes,created_at,updated_at",
      )
      .eq("user_id", user.id),
    supabase
      .from("company_expenses")
      .select(
        "id,user_id,name,amount,amount_includes_vat,vat_rate,vat_deductible,period,is_active,notes,created_at",
      )
      .eq("user_id", user.id),
    supabase
      .from("marketplace_settings")
      .select(
        "id,user_id,marketplace,default_commission_rate,commission_base,default_commission_includes_vat,default_commission_vat_rate,default_shipping_cost,default_shipping_includes_vat,default_shipping_vat_rate,service_fee,service_fee_includes_vat,service_fee_vat_rate,payment_term_days,is_active,created_at",
      )
      .eq("user_id", user.id),
    supabase
      .from("tax_settings")
      .select(
        "id,user_id,name,tax_type,rate,fixed_amount,period,is_active,notes,created_at",
      )
      .eq("user_id", user.id),
    supabase
      .from("countries")
      .select("id,user_id,name,code,has_atr,notes,created_at")
      .eq("user_id", user.id),
  ]);

  const loadError =
    productResult.error ??
    categoriesResult.error ??
    companyExpensesResult.error ??
    marketplaceSettingsResult.error ??
    taxSettingsResult.error ??
    countriesResult.error;

  if (loadError || !productResult.data) {
    return {
      error: loadError?.message ?? "Ürün bulunamadı veya erişim izniniz yok.",
      ok: false,
    };
  }

  const product = productResult.data as ProductPoolItem;
  const categories = (categoriesResult.data ?? []) as ProductCategory[];
  const analysis = buildProfitAnalysis(state, {
    categories,
    companyExpenses: (companyExpensesResult.data ?? []) as CompanyExpense[],
    countries: (countriesResult.data ?? []) as CountrySetting[],
    marketplaceSettings: (marketplaceSettingsResult.data ??
      []) as MarketplaceSetting[],
    products: [product],
    taxSettings: (taxSettingsResult.data ?? []) as TaxSetting[],
  });

  if (!analysis) {
    return {
      error: "Seçilen ürün pazaryeriyle eşleşmiyor.",
      ok: false,
    };
  }

  const primaryScenario = analysis.scenarios.find(
    (scenario) => scenario.key === "estimated",
  );

  if (!primaryScenario || primaryScenario.result.grossSalePrice <= 0) {
    const autoPrice = getAutoEstimatedPrice(product);

    return {
      error:
        state.useProductPrice && autoPrice <= 0
          ? "Üründe indirimli veya normal fiyat yok. Otomatik fiyatı kapatıp tahmini satış fiyatı girin."
          : "Tahmini satış fiyatı sıfırdan büyük olmalıdır.",
      ok: false,
    };
  }

  const category = categories.find(
    (candidate) => candidate.id === product.category_id,
  );
  const subCategory = categories.find(
    (candidate) => candidate.id === product.sub_category_id,
  );
  const inputSnapshot: ProfitSnapshotInput = {
    categoryName: category?.name ?? product.category ?? null,
    commissionRate: analysis.commissionRate,
    effectiveRates: analysis.rates,
    marketplaceSettingId: analysis.marketplaceSetting?.id ?? null,
    state,
    subCategoryName: subCategory?.name ?? product.sub_category ?? null,
  };
  const payload = {
    gross_sale_price: primaryScenario.result.grossSalePrice,
    input_snapshot: toJsonSafe(inputSnapshot),
    marketplace: analysis.marketplace,
    net_margin: primaryScenario.result.netMargin,
    net_profit: primaryScenario.result.netProfit,
    primary_scenario: "estimated",
    product_id: product.id,
    product_name: product.product_name,
    roi: primaryScenario.result.roi,
    scenarios_snapshot: toJsonSafe(analysis.scenarios),
    status: primaryScenario.result.status,
    user_id: user.id,
    warnings: analysis.warnings,
  };
  const { data, error } = await supabase
    .from("profit_calculation_snapshots")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    return {
      error: error?.message ?? "Analiz kaydedilemedi.",
      ok: false,
    };
  }

  revalidatePath(PROFIT_PATH);

  return {
    ok: true,
    snapshot: data as ProfitSnapshot,
  };
}
