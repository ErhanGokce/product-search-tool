import { describe, expect, it } from "vitest";

import type {
  ProductCategory,
  ProductPoolItem,
} from "@/components/product-pool/types";
import type { MarketplaceSetting } from "@/components/settings/types";
import {
  buildProfitAnalysis,
  createProfitCalculatorState,
  getAutoEstimatedPrice,
} from "@/lib/profit/build-profit-analysis";
import { groupProfitSnapshots } from "@/lib/profit/snapshots";
import type { ProfitSnapshot } from "@/lib/profit/types";

function product(
  overrides: Partial<ProductPoolItem> = {},
): ProductPoolItem {
  return {
    category: "Elektronik",
    category_id: "category-1",
    created_at: "2026-06-30T10:00:00.000Z",
    discounted_price: 1_000,
    favorite_count: 0,
    has_big_seller: false,
    id: "product-1",
    is_marketplace_seller: false,
    is_suitable: true,
    marketplace: "Trendyol",
    normal_price: 1_200,
    notes: null,
    product_name: "Test ürünü",
    product_url: null,
    purchase_price: 500,
    purchase_price_includes_vat: true,
    purchase_vat_rate: 20,
    rating_count: 0,
    review_count: 0,
    seller_count: 1,
    sub_category: null,
    sub_category_id: null,
    user_id: "user-1",
    ...overrides,
  };
}

function category(): ProductCategory {
  return {
    additional_customs_duty_rate: 0,
    amazon_commission_rate: null,
    created_at: "2026-06-30T10:00:00.000Z",
    customs_duty_rate: 0,
    excise_tax_rate: 0,
    gtip_code: "8517.13.00.00.11",
    hepsiburada_commission_rate: null,
    id: "category-1",
    name: "Elektronik",
    notes: null,
    parent_id: null,
    trendyol_commission_rate: null,
    trt_tax_rate: 0,
    user_id: "user-1",
    vat_rate: 20,
  };
}

function marketplaceSetting(): MarketplaceSetting {
  return {
    commission_base: "gross_sale_price",
    created_at: "2026-06-30T10:00:00.000Z",
    default_commission_includes_vat: false,
    default_commission_rate: 12,
    default_commission_vat_rate: 20,
    default_shipping_cost: 49,
    default_shipping_includes_vat: true,
    default_shipping_vat_rate: 20,
    id: "setting-1",
    is_active: true,
    marketplace: "Trendyol",
    payment_term_days: 28,
    service_fee: 0,
    service_fee_includes_vat: false,
    service_fee_vat_rate: 20,
    user_id: "user-1",
  };
}

describe("profit analysis builder", () => {
  it("uses discounted price first and falls back to normal price", () => {
    expect(getAutoEstimatedPrice(product())).toBe(1_000);
    expect(
      getAutoEstimatedPrice(product({ discounted_price: null })),
    ).toBe(1_200);
    expect(
      getAutoEstimatedPrice(
        product({ discounted_price: null, normal_price: null }),
      ),
    ).toBe(0);
  });

  it("uses the selected marketplace settings for commission and shipping", () => {
    const selectedProduct = product();
    const state = createProfitCalculatorState(selectedProduct);
    const analysis = buildProfitAnalysis(state, {
      categories: [category()],
      companyExpenses: [],
      countries: [],
      marketplaceSettings: [marketplaceSetting()],
      products: [selectedProduct],
      taxSettings: [],
    });

    expect(analysis?.marketplace).toBe("Trendyol");
    expect(analysis?.commissionRate).toBe(12);
    expect(analysis?.defaultShippingCost).toBe(49);
    expect(
      analysis?.scenarios.find((scenario) => scenario.key === "estimated")
        ?.result.grossSalePrice,
    ).toBe(1_000);
  });

  it("rejects a product that does not belong to the selected marketplace", () => {
    const selectedProduct = product();
    const state = {
      ...createProfitCalculatorState(selectedProduct),
      marketplace: "Amazon" as const,
    };

    expect(
      buildProfitAnalysis(state, {
        categories: [category()],
        companyExpenses: [],
        countries: [],
        marketplaceSettings: [marketplaceSetting()],
        products: [selectedProduct],
        taxSettings: [],
      }),
    ).toBeNull();
  });
});

describe("profit snapshot grouping", () => {
  it("keeps the latest snapshot per product and marketplace", () => {
    const baseSnapshot = {
      gross_sale_price: 1_000,
      input_snapshot: {
        categoryName: null,
        commissionRate: 10,
        effectiveRates: {
          additionalCustomsDutyRate: 0,
          amazonCommissionRate: 0,
          customsDutyRate: 0,
          exciseTaxRate: 0,
          gtipCode: null,
          hepsiburadaCommissionRate: 0,
          trtTaxRate: 0,
          trendyolCommissionRate: 0,
          vatRate: 20,
        },
        marketplaceSettingId: null,
        state: createProfitCalculatorState(product()),
        subCategoryName: null,
      },
      marketplace: "Trendyol" as const,
      net_margin: 10,
      net_profit: 100,
      primary_scenario: "estimated" as const,
      product_id: "product-1",
      product_name: "Test ürünü",
      roi: 20,
      scenarios_snapshot: [],
      status: "Kârlı" as const,
      user_id: "user-1",
      warnings: [],
    };
    const snapshots: ProfitSnapshot[] = [
      {
        ...baseSnapshot,
        created_at: "2026-06-29T10:00:00.000Z",
        id: "snapshot-old",
      },
      {
        ...baseSnapshot,
        created_at: "2026-06-30T10:00:00.000Z",
        id: "snapshot-new",
      },
    ];
    const groups = groupProfitSnapshots(snapshots);

    expect(groups).toHaveLength(1);
    expect(groups[0].latest.id).toBe("snapshot-new");
    expect(groups[0].snapshots).toHaveLength(2);
  });
});
