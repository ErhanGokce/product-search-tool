"use client";

import { useMemo, useState, type ReactNode } from "react";

import type {
  Marketplace,
  ProductCategory,
  ProductPoolItem,
} from "@/components/product-pool/types";
import { marketplaces } from "@/components/product-pool/types";
import { ProductSelector } from "@/components/profit/product-selector";
import { ProfitBreakdownTable } from "@/components/profit/profit-breakdown-table";
import { ProfitScenarioCard } from "@/components/profit/profit-scenario-card";
import { ProfitWarnings } from "@/components/profit/profit-warnings";
import type {
  CommissionBase,
  ProfitCalculationResult,
  VatAmountInput,
  VatBreakdown,
} from "@/lib/profit/calculate-profit";
import { calculateProfit, splitVat } from "@/lib/profit/calculate-profit";
import type {
  CompanyExpense,
  CountrySetting,
  MarketplaceSetting,
  TaxSetting,
} from "@/components/settings/types";
import { commissionBases } from "@/components/settings/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProfitCalculatorProps = {
  categories: ProductCategory[];
  companyExpenses: CompanyExpense[];
  countries: CountrySetting[];
  marketplaceSettings: MarketplaceSetting[];
  products: ProductPoolItem[];
  taxSettings: TaxSetting[];
};

type EffectiveRates = {
  additionalCustomsDutyRate: number;
  amazonCommissionRate: number;
  customsDutyRate: number;
  exciseTaxRate: number;
  gtipCode: string | null;
  hepsiburadaCommissionRate: number;
  trtTaxRate: number;
  trendyolCommissionRate: number;
  vatRate: number;
};

type Scenario = {
  result: ProfitCalculationResult;
  title: string;
};

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getInputValue(value: number | string | null | undefined, fallback = "") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function formatCurrency(value: number | string | null | undefined) {
  const numericValue = toNumber(value);

  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(numericValue);
}

function getMarketplace(product: ProductPoolItem): Marketplace {
  if (marketplaces.includes(product.marketplace as Marketplace)) {
    return product.marketplace as Marketplace;
  }

  return "Trendyol";
}

function getRateValue(
  childValue: number | string | null | undefined,
  parentValue: number | string | null | undefined,
) {
  return toNumber(childValue ?? parentValue ?? 0);
}

function getCategoryContext(
  product: ProductPoolItem,
  categories: ProductCategory[],
) {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const selectedSubCategory = product.sub_category_id
    ? categoriesById.get(product.sub_category_id) ?? null
    : null;
  const selectedCategory = product.category_id
    ? categoriesById.get(product.category_id) ?? null
    : null;
  const parentCategory =
    selectedSubCategory?.parent_id
      ? categoriesById.get(selectedSubCategory.parent_id) ?? selectedCategory
      : selectedCategory;
  const rateSource = selectedSubCategory ?? selectedCategory;

  return {
    category: parentCategory,
    rateSource,
    subCategory: selectedSubCategory,
  };
}

function getEffectiveRates(
  product: ProductPoolItem,
  categories: ProductCategory[],
): EffectiveRates {
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
    trtTaxRate: getRateValue(rateSource?.trt_tax_rate, category?.trt_tax_rate),
    vatRate: getRateValue(rateSource?.vat_rate, category?.vat_rate),
  };
}

function getMarketplaceSetting(
  marketplace: Marketplace,
  marketplaceSettings: MarketplaceSetting[],
) {
  return (
    marketplaceSettings.find(
      (setting) => setting.is_active && setting.marketplace === marketplace,
    ) ??
    marketplaceSettings.find((setting) => setting.marketplace === marketplace) ??
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
  rates: EffectiveRates;
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

  return toNumber(
    getMarketplaceSetting(marketplace, marketplaceSettings)
      ?.default_commission_rate,
  );
}

function getCommissionBase(setting: MarketplaceSetting | null): CommissionBase {
  if (commissionBases.includes(setting?.commission_base as CommissionBase)) {
    return setting?.commission_base as CommissionBase;
  }

  return "gross_sale_price";
}

function getDefaultShippingCost(
  marketplace: Marketplace,
  marketplaceSettings: MarketplaceSetting[],
) {
  return toNumber(
    getMarketplaceSetting(marketplace, marketplaceSettings)
      ?.default_shipping_cost,
  );
}

function getMonthlyExpenseAmount(expense: CompanyExpense) {
  if (!expense.is_active || expense.period === "one_time") {
    return 0;
  }

  const amount = toNumber(expense.amount);

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
      vatRate: toNumber(expense.vat_rate ?? 20),
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

function getScenarioWarnings({
  applyAtrAdvantage,
  commissionRate,
  hasIncomeTaxSetting,
  isImported,
  minimumSalePrices,
  product,
  scenarioPrices,
  selectedCountry,
  selectedProductResultNegative,
}: {
  applyAtrAdvantage: boolean;
  commissionRate: number;
  hasIncomeTaxSetting: boolean;
  isImported: boolean;
  minimumSalePrices: number[];
  product: ProductPoolItem;
  scenarioPrices: number[];
  selectedCountry: CountrySetting | null;
  selectedProductResultNegative: boolean;
}) {
  const warnings: string[] = [];

  if (commissionRate >= 25) {
    warnings.push("Pazaryeri komisyonu yüksek görünüyor; net marj hızla düşebilir.");
  }

  if (selectedProductResultNegative) {
    warnings.push("En az bir senaryoda net kâr negatif. Fiyat veya maliyetleri tekrar kontrol edin.");
  }

  if (
    minimumSalePrices.some(
      (minimumSalePrice, index) =>
        Number.isFinite(minimumSalePrice) &&
        scenarioPrices[index] > 0 &&
        minimumSalePrice > scenarioPrices[index],
    )
  ) {
    warnings.push("Minimum satış fiyatı mevcut senaryo fiyatından yüksek olan senaryo var.");
  }

  if (!product.category_id) {
    warnings.push("Ürün kategorisi seçilmemiş; vergi ve komisyon varsayımları eksik olabilir.");
  }

  if (isImported && !selectedCountry) {
    warnings.push("İthalat seçili ama ülke seçilmedi; ATR ve ülke kontrolleri eksik kalabilir.");
  }

  if (applyAtrAdvantage) {
    warnings.push("ATR yalnızca temel gümrük vergisi avantajı olarak uygulanır; KDV, ÖTV, TRT ve ek yükümlülükler ayrıca hesaplanır.");
  }

  if (!hasIncomeTaxSetting) {
    warnings.push("Gelir vergisi ayarı bulunmasa da hesap 2026 şahıs tarifesiyle tahmini yapılır.");
  }

  return warnings;
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-foreground" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function ProfitCalculator({
  categories,
  companyExpenses,
  countries,
  marketplaceSettings,
  products,
  taxSettings,
}: ProfitCalculatorProps) {
  const initialProduct = products[0] ?? null;
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ?? products[0] ?? null;
  const [purchasePriceInput, setPurchasePriceInput] = useState(() =>
    getInputValue(initialProduct?.purchase_price),
  );
  const [purchaseIncludesVat, setPurchaseIncludesVat] = useState(
    () => initialProduct?.purchase_price_includes_vat ?? true,
  );
  const [purchaseVatRateInput, setPurchaseVatRateInput] = useState(() =>
    getInputValue(initialProduct?.purchase_vat_rate, "20"),
  );
  const [monthlySalesInput, setMonthlySalesInput] = useState("100");
  const [existingAnnualProfitInput, setExistingAnnualProfitInput] = useState("0");
  const [shippingCostInput, setShippingCostInput] = useState("");
  const [packingCostInput, setPackingCostInput] = useState("");
  const [packagingIncludesVat, setPackagingIncludesVat] = useState(true);
  const [packagingVatRateInput, setPackagingVatRateInput] = useState("20");
  const [packagingVatDeductible, setPackagingVatDeductible] = useState(true);
  const [estimatedPriceInput, setEstimatedPriceInput] = useState("");
  const [includeIncomeTax, setIncludeIncomeTax] = useState(true);
  const [includeCompanyExpenses, setIncludeCompanyExpenses] = useState(true);
  const [isImported, setIsImported] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [applyAtrAdvantage, setApplyAtrAdvantage] = useState(false);
  const [customsBaseInput, setCustomsBaseInput] = useState("");
  const [customsBrokerInput, setCustomsBrokerInput] = useState("");
  const [freightInput, setFreightInput] = useState("");
  const [insuranceInput, setInsuranceInput] = useState("");
  const [importExpenseIncludesVat, setImportExpenseIncludesVat] = useState(true);
  const [importExpenseVatRateInput, setImportExpenseVatRateInput] = useState("20");
  const [importExpenseVatDeductible, setImportExpenseVatDeductible] = useState(true);

  function handleProductChange(productId: string) {
    const nextProduct = products.find((product) => product.id === productId) ?? null;

    setSelectedProductId(productId);
    setPurchasePriceInput(getInputValue(nextProduct?.purchase_price));
    setPurchaseIncludesVat(nextProduct?.purchase_price_includes_vat ?? true);
    setPurchaseVatRateInput(getInputValue(nextProduct?.purchase_vat_rate, "20"));
  }

  const calculations = useMemo(() => {
    if (!selectedProduct) {
      return null;
    }

    const marketplace = getMarketplace(selectedProduct);
    const marketplaceSetting = getMarketplaceSetting(
      marketplace,
      marketplaceSettings,
    );
    const selectedCountry =
      countries.find((country) => country.id === selectedCountryId) ?? null;
    const rates = getEffectiveRates(selectedProduct, categories);
    const commissionRate = getCommissionRate({
      marketplace,
      marketplaceSettings,
      rates,
    });
    const defaultShippingCost = getDefaultShippingCost(
      marketplace,
      marketplaceSettings,
    );
    const purchasePrice = toNumber(purchasePriceInput);
    const monthlySales = Math.max(1, toNumber(monthlySalesInput));
    const companyExpenseShare = includeCompanyExpenses
      ? getCompanyExpenseShare(companyExpenses, monthlySales)
      : emptyVatInput();
    const shippingAmount =
      shippingCostInput === "" ? defaultShippingCost : toNumber(shippingCostInput);
    const marketplaceServiceFee: VatAmountInput = {
      amount: toNumber(marketplaceSetting?.service_fee),
      deductibleVat: true,
      includesVat: marketplaceSetting?.service_fee_includes_vat ?? false,
      vatRate: toNumber(marketplaceSetting?.service_fee_vat_rate ?? 20),
    };
    const domesticShippingCost: VatAmountInput = {
      amount: shippingAmount,
      deductibleVat: true,
      includesVat: marketplaceSetting?.default_shipping_includes_vat ?? false,
      vatRate: toNumber(marketplaceSetting?.default_shipping_vat_rate ?? 20),
    };
    const packagingCost: VatAmountInput = {
      amount: toNumber(packingCostInput),
      deductibleVat: packagingVatDeductible,
      includesVat: packagingIncludesVat,
      vatRate: toNumber(packagingVatRateInput),
    };
    const importExpenseInput = {
      deductibleVat: importExpenseVatDeductible,
      includesVat: importExpenseIncludesVat,
      vatRate: toNumber(importExpenseVatRateInput),
    };
    const scenarioPrices = [
      toNumber(selectedProduct.normal_price),
      toNumber(selectedProduct.discounted_price),
      toNumber(estimatedPriceInput),
    ];
    const scenarioTitles = [
      "Normal satış fiyatı",
      "İndirimli satış fiyatı",
      "Tahmini satış fiyatı",
    ];
    const scenarios: Scenario[] = scenarioPrices.map((grossSalePrice, index) => ({
      result: calculateProfit({
        additionalCustomsDutyRate: rates.additionalCustomsDutyRate,
        applyAtrAdvantage:
          isImported && Boolean(selectedCountry?.has_atr) && applyAtrAdvantage,
        companyExpenseShare,
        customsBaseOverride: toNumber(customsBaseInput),
        customsBrokerCost: {
          amount: isImported ? toNumber(customsBrokerInput) : 0,
          ...importExpenseInput,
        },
        customsDutyRate: rates.customsDutyRate,
        domesticShippingCost,
        estimatedMonthlySales: monthlySales,
        existingAnnualProfit: toNumber(existingAnnualProfitInput),
        exciseTaxRate: rates.exciseTaxRate,
        freightCost: {
          amount: isImported ? toNumber(freightInput) : 0,
          ...importExpenseInput,
        },
        grossSalePrice,
        includeIncomeTax,
        insuranceCost: {
          amount: isImported ? toNumber(insuranceInput) : 0,
          ...importExpenseInput,
        },
        isImported,
        marketplaceCommissionBase: getCommissionBase(marketplaceSetting),
        marketplaceCommissionIncludesVat:
          marketplaceSetting?.default_commission_includes_vat ?? false,
        marketplaceCommissionRate: commissionRate,
        marketplaceCommissionVatRate: toNumber(
          marketplaceSetting?.default_commission_vat_rate ?? 20,
        ),
        marketplaceServiceFee,
        packagingCost,
        purchasePrice,
        purchasePriceIncludesVat: purchaseIncludesVat,
        purchaseVatRate: toNumber(purchaseVatRateInput),
        saleVatRate: rates.vatRate,
        trtTaxRate: rates.trtTaxRate,
      }),
      title: scenarioTitles[index],
    }));
    const missingRateLabels = getMissingCategoryRateLabels(selectedProduct, categories);
    const hasIncomeTaxSetting = taxSettings.some(
      (tax) => tax.is_active && tax.tax_type === "income_tax",
    );
    const warnings = getScenarioWarnings({
      applyAtrAdvantage:
        isImported && Boolean(selectedCountry?.has_atr) && applyAtrAdvantage,
      commissionRate,
      hasIncomeTaxSetting,
      isImported,
      minimumSalePrices: scenarios.map((scenario) => scenario.result.minimumSalePrice),
      product: selectedProduct,
      scenarioPrices,
      selectedCountry,
      selectedProductResultNegative: scenarios.some(
        (scenario) => scenario.result.netProfit < 0,
      ),
    });

    if (!rates.gtipCode) {
      warnings.push("GTIP kodu boş. Gümrük ve ek maliyet oranlarını GTIP bazında doğrulayın.");
    }

    if (missingRateLabels.length > 0) {
      warnings.push(
        `Kategori vergi oranlarında eksik alanlar var: ${missingRateLabels.join(", ")}.`,
      );
    }

    if (countries.length === 0) {
      warnings.push("İthalat ülkesi tanımlı değil; ATR ve ülke bazlı kontroller eksik kalabilir.");
    }

    if (scenarios.some((scenario) => scenario.result.carriedVat > 0)) {
      warnings.push("En az bir senaryoda devreden KDV oluşuyor; bu tutar kâr gideri değil, sonraki dönem mahsup kalemidir.");
    }

    if (includeIncomeTax) {
      warnings.push("Gelir vergisi tahmini kesin vergi değildir; dönem net kârı, giderler ve mahsuplara göre değişir.");
    }

    return {
      commissionRate,
      defaultShippingCost,
      marketplace,
      marketplaceSetting,
      rates,
      scenarios,
      selectedCountry,
      warnings,
    };
  }, [
    applyAtrAdvantage,
    categories,
    companyExpenses,
    countries,
    customsBaseInput,
    customsBrokerInput,
    estimatedPriceInput,
    existingAnnualProfitInput,
    freightInput,
    importExpenseIncludesVat,
    importExpenseVatDeductible,
    importExpenseVatRateInput,
    includeCompanyExpenses,
    includeIncomeTax,
    insuranceInput,
    isImported,
    marketplaceSettings,
    monthlySalesInput,
    packagingIncludesVat,
    packagingVatDeductible,
    packagingVatRateInput,
    packingCostInput,
    purchaseIncludesVat,
    purchasePriceInput,
    purchaseVatRateInput,
    selectedCountryId,
    selectedProduct,
    shippingCostInput,
    taxSettings,
  ]);

  if (products.length === 0 || !selectedProduct || !calculations) {
    return (
      <Card>
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <h2 className="text-lg font-semibold tracking-normal text-foreground">
            Hesaplanacak ürün yok
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Kâr hesabı için önce ürün havuzuna en az bir ürün ekleyin.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ürün ve Satış</CardTitle>
              <CardDescription>
                Havuzdaki ürünü seçin, satış senaryolarını ve satış adedini girin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProductSelector
                onProductChange={handleProductChange}
                products={products}
                selectedProductId={selectedProduct.id}
              />
              <div className="rounded-2xl border border-border bg-surface-elevated p-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {selectedProduct.product_name}
                </h3>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                  <p>Pazaryeri: {selectedProduct.marketplace}</p>
                  <p>Kategori: {selectedProduct.category ?? "-"}</p>
                  <p>GTIP: {calculations.rates.gtipCode ?? "-"}</p>
                  <p>Normal fiyat: {formatCurrency(selectedProduct.normal_price)}</p>
                  <p>İndirimli fiyat: {formatCurrency(selectedProduct.discounted_price)}</p>
                  <p>Kayıtlı maliyet: {formatCurrency(selectedProduct.purchase_price)}</p>
                </div>
              </div>
              <div className="grid gap-4">
                <FieldLabel htmlFor="monthly-sales">
                  Tahmini aylık satış adedi
                  <Input
                    id="monthly-sales"
                    inputMode="numeric"
                    min="1"
                    onChange={(event) => setMonthlySalesInput(event.target.value)}
                    type="number"
                    value={monthlySalesInput}
                  />
                </FieldLabel>
                <FieldLabel htmlFor="estimated-price">
                  Tahmini satış fiyatı
                  <Input
                    id="estimated-price"
                    inputMode="decimal"
                    min="0"
                    onChange={(event) => setEstimatedPriceInput(event.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    value={estimatedPriceInput}
                  />
                </FieldLabel>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alış ve Kaynak</CardTitle>
              <CardDescription>
                Maliyet, alış KDV’si ve ithalat varsayımlarını belirleyin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldLabel htmlFor="purchase-price">
                Maliyet TL
                <Input
                  id="purchase-price"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setPurchasePriceInput(event.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={purchasePriceInput}
                />
              </FieldLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldLabel htmlFor="purchase-vat-rate">
                  Alış / ithalat KDV %
                  <Input
                    id="purchase-vat-rate"
                    inputMode="decimal"
                    min="0"
                    onChange={(event) => setPurchaseVatRateInput(event.target.value)}
                    step="0.01"
                    type="number"
                    value={purchaseVatRateInput}
                  />
                </FieldLabel>
                <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface-elevated p-4 text-sm text-foreground">
                  <Checkbox
                    checked={purchaseIncludesVat}
                    onCheckedChange={(value) => setPurchaseIncludesVat(value === true)}
                  />
                  <span>Maliyet KDV dahil</span>
                </label>
              </div>
              <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface-elevated p-4 text-sm text-foreground">
                <Checkbox
                  checked={isImported}
                  onCheckedChange={(value) => setIsImported(value === true)}
                />
                <span>İthalat senaryosu</span>
              </label>
              {isImported ? (
                <div className="space-y-4 rounded-2xl border border-border bg-surface-elevated p-4">
                  <FieldLabel>
                    Alış ülkesi
                    <Select
                      onValueChange={(value) => {
                        setSelectedCountryId(value === "none" ? "" : value);
                        setApplyAtrAdvantage(false);
                      }}
                      value={selectedCountryId || "none"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ülke seç" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ülke yok</SelectItem>
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldLabel>
                  <label className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4 text-sm text-foreground">
                    <Checkbox
                      checked={applyAtrAdvantage}
                      disabled={!calculations.selectedCountry?.has_atr}
                      onCheckedChange={(value) =>
                        setApplyAtrAdvantage(value === true)
                      }
                    />
                    <span>ATR gümrük vergisi avantajını uygula</span>
                  </label>
                  <FieldLabel htmlFor="customs-base">
                    Gümrük matrahı override
                    <Input
                      id="customs-base"
                      inputMode="decimal"
                      min="0"
                      onChange={(event) => setCustomsBaseInput(event.target.value)}
                      placeholder="Boşsa maliyet + navlun + sigorta"
                      step="0.01"
                      type="number"
                      value={customsBaseInput}
                    />
                  </FieldLabel>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <FieldLabel htmlFor="freight">
                      Navlun
                      <Input
                        id="freight"
                        min="0"
                        onChange={(event) => setFreightInput(event.target.value)}
                        step="0.01"
                        type="number"
                        value={freightInput}
                      />
                    </FieldLabel>
                    <FieldLabel htmlFor="insurance">
                      Sigorta
                      <Input
                        id="insurance"
                        min="0"
                        onChange={(event) => setInsuranceInput(event.target.value)}
                        step="0.01"
                        type="number"
                        value={insuranceInput}
                      />
                    </FieldLabel>
                    <FieldLabel htmlFor="broker">
                      Müşavir
                      <Input
                        id="broker"
                        min="0"
                        onChange={(event) => setCustomsBrokerInput(event.target.value)}
                        step="0.01"
                        type="number"
                        value={customsBrokerInput}
                      />
                    </FieldLabel>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="flex items-start gap-3 rounded-2xl border border-border bg-background p-3 text-sm text-foreground">
                      <Checkbox
                        checked={importExpenseIncludesVat}
                        onCheckedChange={(value) =>
                          setImportExpenseIncludesVat(value === true)
                        }
                      />
                      <span>Giderler KDV dahil</span>
                    </label>
                    <label className="flex items-start gap-3 rounded-2xl border border-border bg-background p-3 text-sm text-foreground">
                      <Checkbox
                        checked={importExpenseVatDeductible}
                        onCheckedChange={(value) =>
                          setImportExpenseVatDeductible(value === true)
                        }
                      />
                      <span>KDV indirilebilir</span>
                    </label>
                    <FieldLabel htmlFor="import-expense-vat">
                      Gider KDV %
                      <Input
                        id="import-expense-vat"
                        min="0"
                        onChange={(event) =>
                          setImportExpenseVatRateInput(event.target.value)
                        }
                        step="0.01"
                        type="number"
                        value={importExpenseVatRateInput}
                      />
                    </FieldLabel>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operasyon ve Vergi</CardTitle>
              <CardDescription>
                Kargo, paketleme, şirket gideri ve gelir vergisi varsayımları.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldLabel htmlFor="shipping">
                Kargo ücreti
                <Input
                  id="shipping"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setShippingCostInput(event.target.value)}
                  placeholder={String(calculations.defaultShippingCost || "0.00")}
                  step="0.01"
                  type="number"
                  value={shippingCostInput}
                />
              </FieldLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldLabel htmlFor="packing">
                  Paketleme gideri
                  <Input
                    id="packing"
                    inputMode="decimal"
                    min="0"
                    onChange={(event) => setPackingCostInput(event.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    value={packingCostInput}
                  />
                </FieldLabel>
                <FieldLabel htmlFor="packaging-vat">
                  Paketleme KDV %
                  <Input
                    id="packaging-vat"
                    inputMode="decimal"
                    min="0"
                    onChange={(event) => setPackagingVatRateInput(event.target.value)}
                    step="0.01"
                    type="number"
                    value={packagingVatRateInput}
                  />
                </FieldLabel>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface-elevated p-4 text-sm text-foreground">
                  <Checkbox
                    checked={packagingIncludesVat}
                    onCheckedChange={(value) => setPackagingIncludesVat(value === true)}
                  />
                  <span>Paketleme KDV dahil</span>
                </label>
                <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface-elevated p-4 text-sm text-foreground">
                  <Checkbox
                    checked={packagingVatDeductible}
                    onCheckedChange={(value) => setPackagingVatDeductible(value === true)}
                  />
                  <span>Paketleme KDV indirilebilir</span>
                </label>
              </div>
              <FieldLabel htmlFor="existing-profit">
                Mevcut yıllık kâr varsayımı
                <Input
                  id="existing-profit"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setExistingAnnualProfitInput(event.target.value)}
                  step="0.01"
                  type="number"
                  value={existingAnnualProfitInput}
                />
              </FieldLabel>
              <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface-elevated p-4 text-sm text-foreground">
                <Checkbox
                  checked={includeIncomeTax}
                  onCheckedChange={(value) => setIncludeIncomeTax(value === true)}
                />
                <span>Gelir vergisi etkisini göster</span>
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface-elevated p-4 text-sm text-foreground">
                <Checkbox
                  checked={includeCompanyExpenses}
                  onCheckedChange={(value) =>
                    setIncludeCompanyExpenses(value === true)
                  }
                />
                <span>Şirket gider payını dahil et</span>
              </label>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {calculations.scenarios.map((scenario) => (
              <ProfitScenarioCard
                key={scenario.title}
                result={scenario.result}
                title={scenario.title}
              />
            ))}
          </div>
          <ProfitWarnings warnings={calculations.warnings} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detaylı Kırılım</CardTitle>
          <CardDescription>
            Satış, KDV mahsup, ithalat, pazaryeri, operasyon ve gelir vergisi
            kalemlerinin senaryo bazlı görünümü.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfitBreakdownTable scenarios={calculations.scenarios} />
        </CardContent>
      </Card>
    </div>
  );
}
