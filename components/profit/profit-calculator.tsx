"use client";

import { useMemo, useState } from "react";

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
  CompanyExpense,
  CountrySetting,
  MarketplaceSetting,
} from "@/components/settings/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { calculateProfit } from "@/lib/profit/calculate-profit";

type ProfitCalculatorProps = {
  categories: ProductCategory[];
  companyExpenses: CompanyExpense[];
  countries: CountrySetting[];
  marketplaceSettings: MarketplaceSetting[];
  products: ProductPoolItem[];
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

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
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

  const marketplaceSetting = marketplaceSettings.find(
    (setting) => setting.is_active && setting.marketplace === marketplace,
  );

  return toNumber(marketplaceSetting?.default_commission_rate);
}

function getDefaultShippingCost(
  marketplace: Marketplace,
  marketplaceSettings: MarketplaceSetting[],
) {
  const marketplaceSetting = marketplaceSettings.find(
    (setting) => setting.is_active && setting.marketplace === marketplace,
  );

  return toNumber(marketplaceSetting?.default_shipping_cost);
}

function getMonthlyCompanyExpenseTotal(expenses: CompanyExpense[]) {
  return expenses.reduce((total, expense) => {
    if (!expense.is_active || expense.period === "one_time") {
      return total;
    }

    const amount = toNumber(expense.amount);

    if (expense.period === "quarterly") {
      return total + amount / 3;
    }

    if (expense.period === "yearly") {
      return total + amount / 12;
    }

    return total + amount;
  }, 0);
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
  commissionRate,
  minimumSalePrices,
  product,
  scenarioPrices,
  selectedProductResultNegative,
}: {
  commissionRate: number;
  minimumSalePrices: number[];
  product: ProductPoolItem;
  scenarioPrices: number[];
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

  return warnings;
}

export function ProfitCalculator({
  categories,
  companyExpenses,
  countries,
  marketplaceSettings,
  products,
}: ProfitCalculatorProps) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ?? products[0] ?? null;
  const [productCostInput, setProductCostInput] = useState("");
  const [monthlySalesInput, setMonthlySalesInput] = useState("100");
  const [shippingCostInput, setShippingCostInput] = useState("");
  const [packingCostInput, setPackingCostInput] = useState("");
  const [estimatedPriceInput, setEstimatedPriceInput] = useState("");
  const [includeIncomeTax, setIncludeIncomeTax] = useState(true);
  const [includeCompanyExpenses, setIncludeCompanyExpenses] = useState(true);

  const calculations = useMemo(() => {
    if (!selectedProduct) {
      return null;
    }

    const marketplace = getMarketplace(selectedProduct);
    const rates = getEffectiveRates(selectedProduct, categories);
    const commissionRate = getCommissionRate({
      marketplace,
      marketplaceSettings,
      rates,
    });
    const defaultShippingCost = getDefaultShippingCost(marketplace, marketplaceSettings);
    const productCost = toNumber(productCostInput);
    const monthlySales = Math.max(1, toNumber(monthlySalesInput));
    const shippingCost =
      (shippingCostInput === "" ? defaultShippingCost : toNumber(shippingCostInput)) +
      toNumber(packingCostInput);
    const operatingCostPerProduct = includeCompanyExpenses
      ? getMonthlyCompanyExpenseTotal(companyExpenses) / monthlySales
      : 0;
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
    const scenarios = scenarioPrices.map((grossSalePrice, index) => ({
      result: calculateProfit({
        additionalCustomsDutyRate: rates.additionalCustomsDutyRate,
        commissionRate,
        customsDutyRate: rates.customsDutyRate,
        exciseTaxRate: rates.exciseTaxRate,
        estimatedMonthlySales: monthlySales,
        grossSalePrice,
        includeIncomeTax,
        operatingCostPerProduct,
        productCost,
        shippingCost,
        trtTaxRate: rates.trtTaxRate,
        vatRate: rates.vatRate,
      }),
      title: scenarioTitles[index],
    }));
    const missingRateLabels = getMissingCategoryRateLabels(selectedProduct, categories);
    const warnings = getScenarioWarnings({
      commissionRate,
      minimumSalePrices: scenarios.map((scenario) => scenario.result.minimumSalePrice),
      product: selectedProduct,
      scenarioPrices,
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

    return {
      commissionRate,
      defaultShippingCost,
      marketplace,
      rates,
      scenarios,
      warnings,
    };
  }, [
    categories,
    companyExpenses,
    countries.length,
    estimatedPriceInput,
    includeCompanyExpenses,
    includeIncomeTax,
    marketplaceSettings,
    monthlySalesInput,
    packingCostInput,
    productCostInput,
    selectedProduct,
    shippingCostInput,
  ]);

  if (products.length === 0 || !selectedProduct || !calculations) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <h2 className="text-lg font-semibold tracking-normal text-slate-950">
            Hesaplanacak ürün yok
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Kâr hesabı için önce ürün havuzuna en az bir ürün ekleyin.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Ürün seçimi</CardTitle>
              <CardDescription>
                Havuzdaki ürünü seçin ve hesap varsayımlarını girin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProductSelector
                onProductChange={setSelectedProductId}
                products={products}
                selectedProductId={selectedProduct.id}
              />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-950">
                  {selectedProduct.product_name}
                </h3>
                <div className="mt-3 grid gap-2 text-sm text-slate-600">
                  <p>Pazaryeri: {selectedProduct.marketplace}</p>
                  <p>Kategori: {selectedProduct.category ?? "-"}</p>
                  <p>Alt kategori: {selectedProduct.sub_category ?? "-"}</p>
                  <p>Normal fiyat: {formatCurrency(selectedProduct.normal_price)}</p>
                  <p>
                    İndirimli fiyat: {formatCurrency(selectedProduct.discounted_price)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Hesap girdileri</CardTitle>
              <CardDescription>
                Maliyet, satış adedi ve opsiyonel giderleri belirleyin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Ürün alış/maliyet fiyatı
                <Input
                  className="h-11 rounded-2xl border-slate-200"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setProductCostInput(event.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={productCostInput}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Tahmini aylık satış adedi
                <Input
                  className="h-11 rounded-2xl border-slate-200"
                  inputMode="numeric"
                  min="1"
                  onChange={(event) => setMonthlySalesInput(event.target.value)}
                  type="number"
                  value={monthlySalesInput}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Kargo ücreti
                <Input
                  className="h-11 rounded-2xl border-slate-200"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setShippingCostInput(event.target.value)}
                  placeholder={String(calculations.defaultShippingCost || "0.00")}
                  step="0.01"
                  type="number"
                  value={shippingCostInput}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Ek paketleme gideri
                <Input
                  className="h-11 rounded-2xl border-slate-200"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setPackingCostInput(event.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={packingCostInput}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Tahmini satış fiyatı
                <Input
                  className="h-11 rounded-2xl border-slate-200"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setEstimatedPriceInput(event.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={estimatedPriceInput}
                />
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <Checkbox
                  checked={includeIncomeTax}
                  onCheckedChange={(value) => setIncludeIncomeTax(value === true)}
                />
                <span>Gelir vergisi hesaba katılsın mı?</span>
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <Checkbox
                  checked={includeCompanyExpenses}
                  onCheckedChange={(value) =>
                    setIncludeCompanyExpenses(value === true)
                  }
                />
                <span>Şirket gider payı hesaba katılsın mı?</span>
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

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Detaylı kırılım</CardTitle>
          <CardDescription>
            Vergi, komisyon, maliyet ve kâr kalemlerinin senaryo bazlı görünümü.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfitBreakdownTable scenarios={calculations.scenarios} />
        </CardContent>
      </Card>
    </div>
  );
}
