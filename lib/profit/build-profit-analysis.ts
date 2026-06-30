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
import { commissionBases } from "@/components/settings/types";
import {
  calculateProfit,
  splitVat,
  type CommissionBase,
  type VatAmountInput,
  type VatBreakdown,
} from "@/lib/profit/calculate-profit";
import type {
  EffectiveProfitRates,
  ProfitCalculatorState,
  ProfitScenario,
} from "@/lib/profit/types";

export type ProfitAnalysisContext = {
  categories: ProductCategory[];
  companyExpenses: CompanyExpense[];
  countries: CountrySetting[];
  marketplaceSettings: MarketplaceSetting[];
  products: ProductPoolItem[];
  taxSettings: TaxSetting[];
};

export type ProfitAnalysis = {
  commissionRate: number;
  defaultShippingCost: number;
  marketplace: Marketplace;
  marketplaceSetting: MarketplaceSetting | null;
  product: ProductPoolItem;
  rates: EffectiveProfitRates;
  scenarios: ProfitScenario[];
  selectedCountry: CountrySetting | null;
  warnings: string[];
};

export function toProfitNumber(
  value: number | string | null | undefined,
) {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function getProfitInputValue(
  value: number | string | null | undefined,
  fallback = "",
) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

export function getProductMarketplace(product: ProductPoolItem): Marketplace {
  if (marketplaces.includes(product.marketplace as Marketplace)) {
    return product.marketplace as Marketplace;
  }

  return "Trendyol";
}

export function getAutoEstimatedPrice(product: ProductPoolItem | null) {
  if (!product) {
    return 0;
  }

  const discountedPrice = toProfitNumber(product.discounted_price);

  if (discountedPrice > 0) {
    return discountedPrice;
  }

  return toProfitNumber(product.normal_price);
}

export function createProfitCalculatorState(
  product: ProductPoolItem | null,
): ProfitCalculatorState {
  return {
    applyAtrAdvantage: false,
    customsBaseInput: "",
    customsBrokerInput: "",
    estimatedPriceInput: getProfitInputValue(getAutoEstimatedPrice(product)),
    existingAnnualProfitInput: "0",
    freightInput: "",
    importExpenseIncludesVat: true,
    importExpenseVatDeductible: true,
    importExpenseVatRateInput: "20",
    includeCompanyExpenses: true,
    includeIncomeTax: true,
    insuranceInput: "",
    isImported: false,
    marketplace: product ? getProductMarketplace(product) : "Trendyol",
    monthlySalesInput: "100",
    purchaseIncludesVat: product?.purchase_price_includes_vat ?? true,
    purchasePriceInput: getProfitInputValue(product?.purchase_price),
    purchaseVatRateInput: getProfitInputValue(product?.purchase_vat_rate, "20"),
    selectedCountryId: "",
    selectedProductId: product?.id ?? "",
    shippingCostInput: "",
    useProductPrice: true,
  };
}

function getRateValue(
  childValue: number | string | null | undefined,
  parentValue: number | string | null | undefined,
) {
  return toProfitNumber(childValue ?? parentValue ?? 0);
}

function getCategoryContext(
  product: ProductPoolItem,
  categories: ProductCategory[],
) {
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const selectedSubCategory = product.sub_category_id
    ? categoriesById.get(product.sub_category_id) ?? null
    : null;
  const selectedCategory = product.category_id
    ? categoriesById.get(product.category_id) ?? null
    : null;
  const parentCategory = selectedSubCategory?.parent_id
    ? categoriesById.get(selectedSubCategory.parent_id) ?? selectedCategory
    : selectedCategory;
  const rateSource = selectedSubCategory ?? selectedCategory;

  return {
    category: parentCategory,
    rateSource,
    subCategory: selectedSubCategory,
  };
}

export function getEffectiveProfitRates(
  product: ProductPoolItem,
  categories: ProductCategory[],
): EffectiveProfitRates {
  const { category, rateSource } = getCategoryContext(product, categories);

  return {
    additionalCustomsDutyRate: getRateValue(
      rateSource?.additional_customs_duty_rate,
      category?.additional_customs_duty_rate,
    ),
    amazonCommissionRate: getRateValue(
      rateSource?.amazon_commission_rate,
      category?.amazon_commission_rate,
    ),
    customsDutyRate: getRateValue(
      rateSource?.customs_duty_rate,
      category?.customs_duty_rate,
    ),
    exciseTaxRate: getRateValue(
      rateSource?.excise_tax_rate,
      category?.excise_tax_rate,
    ),
    gtipCode: rateSource?.gtip_code ?? category?.gtip_code ?? null,
    hepsiburadaCommissionRate: getRateValue(
      rateSource?.hepsiburada_commission_rate,
      category?.hepsiburada_commission_rate,
    ),
    trendyolCommissionRate: getRateValue(
      rateSource?.trendyol_commission_rate,
      category?.trendyol_commission_rate,
    ),
    trtTaxRate: getRateValue(
      rateSource?.trt_tax_rate,
      category?.trt_tax_rate,
    ),
    vatRate: getRateValue(rateSource?.vat_rate, category?.vat_rate),
  };
}

function getMarketplaceSetting(
  marketplace: Marketplace,
  marketplaceSettings: MarketplaceSetting[],
) {
  return (
    marketplaceSettings.find(
      (setting) =>
        setting.is_active && setting.marketplace === marketplace,
    ) ??
    marketplaceSettings.find(
      (setting) => setting.marketplace === marketplace,
    ) ??
    null
  );
}

function getCommissionRate({
  marketplace,
  marketplaceSettings,
  rates,
}: {
  marketplace: Marketplace;
  marketplaceSettings: MarketplaceSetting[];
  rates: EffectiveProfitRates;
}) {
  const categoryRateByMarketplace: Record<Marketplace, number> = {
    Amazon: rates.amazonCommissionRate,
    Hepsiburada: rates.hepsiburadaCommissionRate,
    Trendyol: rates.trendyolCommissionRate,
  };
  const categoryRate = categoryRateByMarketplace[marketplace];

  if (categoryRate > 0) {
    return categoryRate;
  }

  return toProfitNumber(
    getMarketplaceSetting(marketplace, marketplaceSettings)
      ?.default_commission_rate,
  );
}

function getCommissionBase(
  setting: MarketplaceSetting | null,
): CommissionBase {
  if (commissionBases.includes(setting?.commission_base as CommissionBase)) {
    return setting?.commission_base as CommissionBase;
  }

  return "gross_sale_price";
}

function getMonthlyExpenseAmount(expense: CompanyExpense) {
  if (!expense.is_active || expense.period === "one_time") {
    return 0;
  }

  const amount = toProfitNumber(expense.amount);

  if (expense.period === "quarterly") {
    return amount / 3;
  }

  if (expense.period === "yearly") {
    return amount / 12;
  }

  return amount;
}

function getCompanyExpenseShare(
  expenses: CompanyExpense[],
  monthlySales: number,
): VatAmountInput {
  const totals: VatBreakdown = {
    deductibleVat: 0,
    grossAmount: 0,
    netAmount: 0,
    profitCost: 0,
    vatAmount: 0,
  };
  const divisor = Math.max(1, monthlySales);

  expenses.forEach((expense) => {
    const breakdown = splitVat({
      amount: getMonthlyExpenseAmount(expense),
      deductibleVat: expense.vat_deductible ?? false,
      includesVat: expense.amount_includes_vat ?? false,
      vatRate: toProfitNumber(expense.vat_rate ?? 20),
    });

    totals.deductibleVat += breakdown.deductibleVat;
    totals.grossAmount += breakdown.grossAmount;
    totals.netAmount += breakdown.netAmount;
    totals.profitCost += breakdown.profitCost;
    totals.vatAmount += breakdown.vatAmount;
  });

  return {
    amount: totals.grossAmount / divisor,
    deductibleVat: false,
    includesVat: false,
    precomputed: {
      deductibleVat: totals.deductibleVat / divisor,
      grossAmount: totals.grossAmount / divisor,
      netAmount: totals.netAmount / divisor,
      profitCost: totals.profitCost / divisor,
      vatAmount: totals.vatAmount / divisor,
    },
    vatRate: 0,
  };
}

function emptyVatInput(): VatAmountInput {
  return {
    amount: 0,
    deductibleVat: false,
    includesVat: false,
    vatRate: 0,
  };
}

function getMissingCategoryRateLabels(
  product: ProductPoolItem,
  categories: ProductCategory[],
) {
  const { category, rateSource } = getCategoryContext(product, categories);
  const fields = [
    { key: "vat_rate", label: "KDV" },
    { key: "customs_duty_rate", label: "Gümrük" },
    { key: "additional_customs_duty_rate", label: "İlave gümrük" },
    { key: "excise_tax_rate", label: "ÖTV" },
    { key: "trt_tax_rate", label: "TRT" },
  ] as const;

  return fields
    .filter(({ key }) => {
      const value = rateSource?.[key] ?? category?.[key];

      return value === null || value === undefined || value === "";
    })
    .map((field) => field.label);
}

function buildWarnings({
  applyAtrAdvantage,
  commissionRate,
  context,
  isImported,
  product,
  scenarios,
  selectedCountry,
  state,
}: {
  applyAtrAdvantage: boolean;
  commissionRate: number;
  context: ProfitAnalysisContext;
  isImported: boolean;
  product: ProductPoolItem;
  scenarios: ProfitScenario[];
  selectedCountry: CountrySetting | null;
  state: ProfitCalculatorState;
}) {
  const warnings: string[] = [];
  const scenarioPrices = scenarios.map(
    (scenario) => scenario.result.grossSalePrice,
  );

  if (commissionRate >= 25) {
    warnings.push(
      "Pazaryeri komisyonu yüksek görünüyor; net marj hızla düşebilir.",
    );
  }

  if (scenarios.some((scenario) => scenario.result.netProfit < 0)) {
    warnings.push(
      "En az bir senaryoda net kâr negatif. Fiyat veya maliyetleri tekrar kontrol edin.",
    );
  }

  if (
    scenarios.some(
      (scenario, index) =>
        Number.isFinite(scenario.result.minimumSalePrice) &&
        scenarioPrices[index] > 0 &&
        scenario.result.minimumSalePrice > scenarioPrices[index],
    )
  ) {
    warnings.push(
      "Minimum satış fiyatı mevcut senaryo fiyatından yüksek olan senaryo var.",
    );
  }

  if (!product.category_id) {
    warnings.push(
      "Ürün kategorisi seçilmemiş; vergi ve komisyon varsayımları eksik olabilir.",
    );
  }

  if (isImported && !selectedCountry) {
    warnings.push(
      "İthalat seçili ama ülke seçilmedi; ATR ve ülke kontrolleri eksik kalabilir.",
    );
  }

  if (applyAtrAdvantage) {
    warnings.push(
      "ATR yalnızca temel gümrük vergisi avantajı olarak uygulanır; KDV, ÖTV, TRT ve ek yükümlülükler ayrıca hesaplanır.",
    );
  }

  if (
    !context.taxSettings.some(
      (tax) => tax.is_active && tax.tax_type === "income_tax",
    )
  ) {
    warnings.push(
      "Gelir vergisi ayarı bulunmasa da hesap 2026 şahıs tarifesiyle tahmini yapılır.",
    );
  }

  const rates = getEffectiveProfitRates(product, context.categories);

  if (!rates.gtipCode) {
    warnings.push(
      "GTIP kodu boş. Gümrük ve ek maliyet oranlarını GTIP bazında doğrulayın.",
    );
  }

  const missingRateLabels = getMissingCategoryRateLabels(
    product,
    context.categories,
  );

  if (missingRateLabels.length > 0) {
    warnings.push(
      `Kategori vergi oranlarında eksik alanlar var: ${missingRateLabels.join(", ")}.`,
    );
  }

  if (context.countries.length === 0) {
    warnings.push(
      "İthalat ülkesi tanımlı değil; ATR ve ülke bazlı kontroller eksik kalabilir.",
    );
  }

  if (scenarios.some((scenario) => scenario.result.carriedVat > 0)) {
    warnings.push(
      "En az bir senaryoda devreden KDV oluşuyor; bu tutar kâr gideri değil, sonraki dönem mahsup kalemidir.",
    );
  }

  if (state.includeIncomeTax) {
    warnings.push(
      "Gelir vergisi tahmini kesin vergi değildir; dönem net kârı, giderler ve mahsuplara göre değişir.",
    );
  }

  return warnings;
}

export function buildProfitAnalysis(
  state: ProfitCalculatorState,
  context: ProfitAnalysisContext,
): ProfitAnalysis | null {
  const product =
    context.products.find(
      (candidate) => candidate.id === state.selectedProductId,
    ) ?? null;

  if (!product || getProductMarketplace(product) !== state.marketplace) {
    return null;
  }

  const marketplace = state.marketplace;
  const marketplaceSetting = getMarketplaceSetting(
    marketplace,
    context.marketplaceSettings,
  );
  const selectedCountry =
    context.countries.find(
      (country) => country.id === state.selectedCountryId,
    ) ?? null;
  const rates = getEffectiveProfitRates(product, context.categories);
  const commissionRate = getCommissionRate({
    marketplace,
    marketplaceSettings: context.marketplaceSettings,
    rates,
  });
  const defaultShippingCost = toProfitNumber(
    marketplaceSetting?.default_shipping_cost,
  );
  const purchasePrice = toProfitNumber(state.purchasePriceInput);
  const monthlySales = Math.max(
    1,
    toProfitNumber(state.monthlySalesInput),
  );
  const companyExpenseShare = state.includeCompanyExpenses
    ? getCompanyExpenseShare(context.companyExpenses, monthlySales)
    : emptyVatInput();
  const shippingAmount =
    state.shippingCostInput === ""
      ? defaultShippingCost
      : toProfitNumber(state.shippingCostInput);
  const marketplaceServiceFee: VatAmountInput = {
    amount: toProfitNumber(marketplaceSetting?.service_fee),
    deductibleVat: true,
    includesVat: marketplaceSetting?.service_fee_includes_vat ?? false,
    vatRate: toProfitNumber(
      marketplaceSetting?.service_fee_vat_rate ?? 20,
    ),
  };
  const domesticShippingCost: VatAmountInput = {
    amount: shippingAmount,
    deductibleVat: true,
    includesVat:
      marketplaceSetting?.default_shipping_includes_vat ?? false,
    vatRate: toProfitNumber(
      marketplaceSetting?.default_shipping_vat_rate ?? 20,
    ),
  };
  const importExpenseInput = {
    deductibleVat: state.importExpenseVatDeductible,
    includesVat: state.importExpenseIncludesVat,
    vatRate: toProfitNumber(state.importExpenseVatRateInput),
  };
  const estimatedPrice = state.useProductPrice
    ? getAutoEstimatedPrice(product)
    : toProfitNumber(state.estimatedPriceInput);
  const scenarioDefinitions = [
    {
      grossSalePrice: toProfitNumber(product.normal_price),
      key: "normal",
      title: "Normal satış fiyatı",
    },
    {
      grossSalePrice: toProfitNumber(product.discounted_price),
      key: "discounted",
      title: "İndirimli satış fiyatı",
    },
    {
      grossSalePrice: estimatedPrice,
      key: "estimated",
      title: "Tahmini satış fiyatı",
    },
  ] as const;
  const applyAtrAdvantage =
    state.isImported &&
    Boolean(selectedCountry?.has_atr) &&
    state.applyAtrAdvantage;
  const scenarios: ProfitScenario[] = scenarioDefinitions.map(
    ({ grossSalePrice, key, title }) => ({
      key,
      result: calculateProfit({
        additionalCustomsDutyRate: rates.additionalCustomsDutyRate,
        applyAtrAdvantage,
        companyExpenseShare,
        customsBaseOverride: toProfitNumber(state.customsBaseInput),
        customsBrokerCost: {
          amount: state.isImported
            ? toProfitNumber(state.customsBrokerInput)
            : 0,
          ...importExpenseInput,
        },
        customsDutyRate: rates.customsDutyRate,
        domesticShippingCost,
        estimatedMonthlySales: monthlySales,
        existingAnnualProfit: toProfitNumber(
          state.existingAnnualProfitInput,
        ),
        exciseTaxRate: rates.exciseTaxRate,
        freightCost: {
          amount: state.isImported ? toProfitNumber(state.freightInput) : 0,
          ...importExpenseInput,
        },
        grossSalePrice,
        includeIncomeTax: state.includeIncomeTax,
        insuranceCost: {
          amount: state.isImported
            ? toProfitNumber(state.insuranceInput)
            : 0,
          ...importExpenseInput,
        },
        isImported: state.isImported,
        marketplaceCommissionBase: getCommissionBase(marketplaceSetting),
        marketplaceCommissionIncludesVat:
          marketplaceSetting?.default_commission_includes_vat ?? false,
        marketplaceCommissionRate: commissionRate,
        marketplaceCommissionVatRate: toProfitNumber(
          marketplaceSetting?.default_commission_vat_rate ?? 20,
        ),
        marketplaceServiceFee,
        purchasePrice,
        purchasePriceIncludesVat: state.purchaseIncludesVat,
        purchaseVatRate: toProfitNumber(state.purchaseVatRateInput),
        saleVatRate: rates.vatRate,
        trtTaxRate: rates.trtTaxRate,
      }),
      title,
    }),
  );

  return {
    commissionRate,
    defaultShippingCost,
    marketplace,
    marketplaceSetting,
    product,
    rates,
    scenarios,
    selectedCountry,
    warnings: buildWarnings({
      applyAtrAdvantage,
      commissionRate,
      context,
      isImported: state.isImported,
      product,
      scenarios,
      selectedCountry,
      state,
    }),
  };
}
