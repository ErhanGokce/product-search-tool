"use client";

import {
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Save,
} from "lucide-react";

import { saveProfitSnapshot } from "@/app/calculate/profit/actions";
import type {
  Marketplace,
  ProductCategory,
  ProductPoolItem,
} from "@/components/product-pool/types";
import { ProductSelector } from "@/components/profit/product-selector";
import { ProfitBreakdownTable } from "@/components/profit/profit-breakdown-table";
import { ProfitHistory } from "@/components/profit/profit-history";
import { ProfitScenarioCard } from "@/components/profit/profit-scenario-card";
import { ProfitWarnings } from "@/components/profit/profit-warnings";
import type {
  CompanyExpense,
  CountrySetting,
  MarketplaceSetting,
  TaxSetting,
} from "@/components/settings/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  buildProfitAnalysis,
  createProfitCalculatorState,
  getAutoEstimatedPrice,
  getProductMarketplace,
  getProfitInputValue,
  toProfitNumber,
} from "@/lib/profit/build-profit-analysis";
import type {
  ProfitCalculatorState,
  ProfitSnapshot,
} from "@/lib/profit/types";
import { cn } from "@/lib/utils";

type ProfitCalculatorProps = {
  categories: ProductCategory[];
  companyExpenses: CompanyExpense[];
  countries: CountrySetting[];
  marketplaceSettings: MarketplaceSetting[];
  products: ProductPoolItem[];
  snapshots: ProfitSnapshot[];
  snapshotStorageAvailable: boolean;
  taxSettings: TaxSetting[];
};

type StepNumber = 1 | 2 | 3;

const steps: { description: string; label: string; value: StepNumber }[] = [
  {
    description: "Pazaryeri ve ürün",
    label: "Ürün",
    value: 1,
  },
  {
    description: "Maliyet ve varsayımlar",
    label: "Maliyet",
    value: 2,
  },
  {
    description: "Sonuç ve kayıt",
    label: "Analiz",
    value: 3,
  },
];

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(toProfitNumber(value));
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      className="space-y-2 text-sm font-medium text-foreground"
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

function InfoTooltip({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={label}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          type="button"
        >
          <Info className="size-4" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm px-3 py-2 text-left text-xs leading-5">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

function Stepper({
  activeStep,
  canOpenStep,
  onStepChange,
}: {
  activeStep: StepNumber;
  canOpenStep: (step: StepNumber) => boolean;
  onStepChange: (step: StepNumber) => void;
}) {
  return (
    <ol className="grid grid-cols-3 gap-2">
      {steps.map((step) => {
        const isActive = activeStep === step.value;
        const isComplete = activeStep > step.value;
        const isEnabled = canOpenStep(step.value);

        return (
          <li key={step.value}>
            <button
              className={cn(
                "flex min-h-16 w-full items-center gap-3 rounded-2xl border px-3 text-left transition-colors sm:px-4",
                isActive
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-card hover:bg-muted/60",
                !isEnabled && "cursor-not-allowed opacity-55",
              )}
              disabled={!isEnabled}
              onClick={() => onStepChange(step.value)}
              type="button"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isActive || isComplete
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {isComplete ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  step.value
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">
                  {step.label}
                </span>
                <span className="hidden truncate text-xs text-muted-foreground sm:block">
                  {step.description}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function TogglePanel({
  checked,
  description,
  info,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  description?: string;
  info?: ReactNode;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-surface-elevated p-4">
      <div className="flex min-w-0 gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {info ? (
          <InfoTooltip label={`${label} hakkında bilgi`}>{info}</InfoTooltip>
        ) : null}
      </div>
      <Switch
        aria-label={label}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

export function ProfitCalculator({
  categories,
  companyExpenses,
  countries,
  marketplaceSettings,
  products,
  snapshots,
  snapshotStorageAvailable,
  taxSettings,
}: ProfitCalculatorProps) {
  const initialProduct = products[0] ?? null;
  const [calculatorState, setCalculatorState] =
    useState<ProfitCalculatorState>(() =>
      createProfitCalculatorState(initialProduct),
    );
  const [activeStep, setActiveStep] = useState<StepNumber>(1);
  const [activeTab, setActiveTab] = useState("calculator");
  const [localSnapshots, setLocalSnapshots] = useState(snapshots);
  const [saveError, setSaveError] = useState("");
  const [isSaving, startSaving] = useTransition();

  const selectedProduct =
    products.find(
      (product) => product.id === calculatorState.selectedProductId,
    ) ?? null;
  const filteredProducts = products.filter(
    (product) => product.marketplace === calculatorState.marketplace,
  );
  const analysis = useMemo(
    () =>
      buildProfitAnalysis(calculatorState, {
        categories,
        companyExpenses,
        countries,
        marketplaceSettings,
        products,
        taxSettings,
      }),
    [
      calculatorState,
      categories,
      companyExpenses,
      countries,
      marketplaceSettings,
      products,
      taxSettings,
    ],
  );
  const automaticPrice = getAutoEstimatedPrice(selectedProduct);
  const resolvedEstimatedPrice = calculatorState.useProductPrice
    ? automaticPrice
    : toProfitNumber(calculatorState.estimatedPriceInput);
  const hasValidProduct = Boolean(
    selectedProduct &&
      getProductMarketplace(selectedProduct) === calculatorState.marketplace,
  );
  const fieldErrors = {
    estimatedPrice:
      resolvedEstimatedPrice > 0
        ? ""
        : "Tahmini satış fiyatı sıfırdan büyük olmalıdır.",
    monthlySales:
      toProfitNumber(calculatorState.monthlySalesInput) > 0
        ? ""
        : "Aylık satış adedi sıfırdan büyük olmalıdır.",
    purchasePrice:
      toProfitNumber(calculatorState.purchasePriceInput) > 0
        ? ""
        : "Ürün maliyeti sıfırdan büyük olmalıdır.",
  };
  const hasValidCosts = Object.values(fieldErrors).every(
    (message) => !message,
  );

  function updateState<K extends keyof ProfitCalculatorState>(
    key: K,
    value: ProfitCalculatorState[K],
  ) {
    setCalculatorState((current) => ({
      ...current,
      [key]: value,
    }));
    setSaveError("");
  }

  function getStateForProduct(
    current: ProfitCalculatorState,
    product: ProductPoolItem | null,
    marketplace: Marketplace,
  ): ProfitCalculatorState {
    return {
      ...current,
      applyAtrAdvantage: false,
      estimatedPriceInput: getProfitInputValue(
        getAutoEstimatedPrice(product),
      ),
      marketplace,
      purchaseIncludesVat:
        product?.purchase_price_includes_vat ?? true,
      purchasePriceInput: getProfitInputValue(product?.purchase_price),
      purchaseVatRateInput: getProfitInputValue(
        product?.purchase_vat_rate,
        "20",
      ),
      selectedCountryId: "",
      selectedProductId: product?.id ?? "",
      shippingCostInput: "",
    };
  }

  function handleMarketplaceChange(marketplace: Marketplace) {
    const nextProduct =
      products.find((product) => product.marketplace === marketplace) ?? null;

    setCalculatorState((current) =>
      getStateForProduct(current, nextProduct, marketplace),
    );
    setSaveError("");
  }

  function handleProductChange(productId: string) {
    const nextProduct =
      products.find((product) => product.id === productId) ?? null;

    setCalculatorState((current) =>
      getStateForProduct(
        current,
        nextProduct,
        nextProduct ? getProductMarketplace(nextProduct) : current.marketplace,
      ),
    );
    setSaveError("");
  }

  function canOpenStep(step: StepNumber) {
    if (step === 1) {
      return true;
    }

    if (step === 2) {
      return hasValidProduct;
    }

    return hasValidProduct && hasValidCosts;
  }

  function handleSave() {
    if (!snapshotStorageAvailable) {
      setSaveError(
        "Snapshot tablosu hazır değil. 008 migration dosyasını Supabase üzerinde çalıştırın.",
      );
      return;
    }

    if (!analysis || !hasValidProduct || !hasValidCosts) {
      setSaveError("Kaydetmeden önce zorunlu alanları tamamlayın.");
      return;
    }

    startSaving(async () => {
      const result = await saveProfitSnapshot(calculatorState);

      if (!result.ok || !result.snapshot) {
        setSaveError(
          result.error ?? "Analiz kaydedilemedi. Tekrar deneyin.",
        );
        return;
      }

      setLocalSnapshots((current) => [result.snapshot!, ...current]);
      setSaveError("");
      setActiveTab("history");
    });
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <h2 className="text-lg font-semibold text-foreground">
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
    <TooltipProvider delayDuration={180}>
      <Tabs onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid h-auto w-full grid-cols-2 sm:w-auto">
          <TabsTrigger className="min-h-10" value="calculator">
            Yeni Hesaplama
          </TabsTrigger>
          <TabsTrigger className="min-h-10" value="history">
            Kayıtlı Analizler
            {localSnapshots.length > 0 ? (
              <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-[10px]">
                {localSnapshots.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-5" value="calculator">
          {!snapshotStorageAvailable ? (
            <div
              className="rounded-2xl border border-warning-border bg-warning-surface p-4 text-sm leading-6 text-warning-foreground"
              role="status"
            >
              Hesaplama kullanılabilir, ancak analiz kaydı henüz hazır değil.
              Supabase üzerinde{" "}
              <code className="rounded bg-black/20 px-1.5 py-0.5 text-xs">
                008-create-profit-calculation-snapshots.sql
              </code>{" "}
              migration dosyasını çalıştırdıktan sonra kayıt özelliği
              açılacaktır.
            </div>
          ) : null}

          <Stepper
            activeStep={activeStep}
            canOpenStep={canOpenStep}
            onStepChange={setActiveStep}
          />

          {activeStep === 1 ? (
            <Card>
              <CardHeader>
                <CardTitle>Pazaryeri ve Ürün</CardTitle>
                <CardDescription>
                  Hesaplama ayarları seçtiğiniz pazaryerine göre uygulanır.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ProductSelector
                  onMarketplaceChange={handleMarketplaceChange}
                  onProductChange={handleProductChange}
                  products={products}
                  selectedMarketplace={calculatorState.marketplace}
                  selectedProductId={calculatorState.selectedProductId}
                />

                {filteredProducts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                    <p className="text-sm font-medium text-foreground">
                      {calculatorState.marketplace} için ürün bulunamadı
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ürün havuzundan bu pazaryerine bir ürün ekleyin.
                    </p>
                  </div>
                ) : selectedProduct ? (
                  <div className="grid gap-4 rounded-2xl border border-border bg-surface-elevated p-4 sm:grid-cols-[1fr_auto]">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {selectedProduct.product_name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedProduct.category ?? "Kategori yok"}
                        {selectedProduct.sub_category
                          ? ` / ${selectedProduct.sub_category}`
                          : ""}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        GTIP: {analysis?.rates.gtipCode ?? "Tanımlı değil"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-right text-sm sm:grid-cols-1">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Normal fiyat
                        </p>
                        <p className="mt-1 font-semibold text-foreground">
                          {formatCurrency(selectedProduct.normal_price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          İndirimli fiyat
                        </p>
                        <p className="mt-1 font-semibold text-foreground">
                          {formatCurrency(selectedProduct.discounted_price)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="flex justify-end">
                  <Button
                    disabled={!hasValidProduct}
                    onClick={() => setActiveStep(2)}
                    type="button"
                  >
                    Maliyetlere geç
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {activeStep === 2 ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Satış ve Maliyet</CardTitle>
                  <CardDescription>
                    Ürün başı maliyet ve satış hacmi varsayımlarını girin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldLabel htmlFor="purchase-price">
                      Ürün maliyeti
                      <Input
                        aria-invalid={Boolean(fieldErrors.purchasePrice)}
                        id="purchase-price"
                        inputMode="decimal"
                        min="0"
                        onChange={(event) =>
                          updateState(
                            "purchasePriceInput",
                            event.target.value,
                          )
                        }
                        placeholder="0.00"
                        step="0.01"
                        type="number"
                        value={calculatorState.purchasePriceInput}
                      />
                      {fieldErrors.purchasePrice ? (
                        <span className="block text-xs text-red-300">
                          {fieldErrors.purchasePrice}
                        </span>
                      ) : null}
                    </FieldLabel>
                    <FieldLabel htmlFor="monthly-sales">
                      Tahmini aylık satış adedi
                      <Input
                        aria-invalid={Boolean(fieldErrors.monthlySales)}
                        id="monthly-sales"
                        inputMode="numeric"
                        min="1"
                        onChange={(event) =>
                          updateState(
                            "monthlySalesInput",
                            event.target.value,
                          )
                        }
                        type="number"
                        value={calculatorState.monthlySalesInput}
                      />
                      {fieldErrors.monthlySales ? (
                        <span className="block text-xs text-red-300">
                          {fieldErrors.monthlySales}
                        </span>
                      ) : null}
                    </FieldLabel>
                  </div>

                  <TogglePanel
                    checked={calculatorState.useProductPrice}
                    description="İndirimli fiyat varsa onu, yoksa normal fiyatı kullanır."
                    label="Tahmini satış fiyatını üründen al"
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        updateState(
                          "estimatedPriceInput",
                          getProfitInputValue(automaticPrice),
                        );
                      }
                      updateState("useProductPrice", checked);
                    }}
                  />

                  <FieldLabel htmlFor="estimated-price">
                    Tahmini satış fiyatı
                    <Input
                      aria-invalid={Boolean(fieldErrors.estimatedPrice)}
                      className={cn(
                        calculatorState.useProductPrice &&
                          "bg-muted/60 text-muted-foreground",
                      )}
                      id="estimated-price"
                      inputMode="decimal"
                      min="0"
                      onChange={(event) =>
                        updateState(
                          "estimatedPriceInput",
                          event.target.value,
                        )
                      }
                      readOnly={calculatorState.useProductPrice}
                      step="0.01"
                      type="number"
                      value={
                        calculatorState.useProductPrice
                          ? getProfitInputValue(automaticPrice)
                          : calculatorState.estimatedPriceInput
                      }
                    />
                    <span className="block text-xs font-normal text-muted-foreground">
                      {calculatorState.useProductPrice
                        ? toProfitNumber(selectedProduct?.discounted_price) > 0
                          ? "Kaynak: ürünün indirimli fiyatı"
                          : toProfitNumber(selectedProduct?.normal_price) > 0
                            ? "Kaynak: ürünün normal fiyatı"
                            : "Üründe fiyat bulunamadı; otomatik seçimi kapatın."
                        : "Manuel tahmini fiyat kullanılıyor."}
                    </span>
                    {fieldErrors.estimatedPrice ? (
                      <span className="block text-xs text-red-300">
                        {fieldErrors.estimatedPrice}
                      </span>
                    ) : null}
                  </FieldLabel>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldLabel htmlFor="purchase-vat-rate">
                      Alış / ithalat KDV %
                      <Input
                        id="purchase-vat-rate"
                        inputMode="decimal"
                        min="0"
                        onChange={(event) =>
                          updateState(
                            "purchaseVatRateInput",
                            event.target.value,
                          )
                        }
                        step="0.01"
                        type="number"
                        value={calculatorState.purchaseVatRateInput}
                      />
                    </FieldLabel>
                    <label className="flex min-h-20 items-center gap-3 rounded-2xl border border-border bg-surface-elevated p-4 text-sm text-foreground">
                      <Checkbox
                        checked={calculatorState.purchaseIncludesVat}
                        onCheckedChange={(value) =>
                          updateState(
                            "purchaseIncludesVat",
                            value === true,
                          )
                        }
                      />
                      <span>Maliyet KDV dahil</span>
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Operasyon ve Vergi</CardTitle>
                  <CardDescription>
                    Kargo ve dönemsel kârlılık varsayımlarını belirleyin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldLabel htmlFor="shipping">
                      Kargo ücreti
                      <Input
                        id="shipping"
                        inputMode="decimal"
                        min="0"
                        onChange={(event) =>
                          updateState(
                            "shippingCostInput",
                            event.target.value,
                          )
                        }
                        placeholder={String(
                          analysis?.defaultShippingCost || "0.00",
                        )}
                        step="0.01"
                        type="number"
                        value={calculatorState.shippingCostInput}
                      />
                      <span className="block text-xs font-normal text-muted-foreground">
                        Boşsa pazaryeri varsayılanı kullanılır.
                      </span>
                    </FieldLabel>
                    <FieldLabel htmlFor="existing-profit">
                      Mevcut yıllık kâr varsayımı
                      <Input
                        id="existing-profit"
                        inputMode="decimal"
                        min="0"
                        onChange={(event) =>
                          updateState(
                            "existingAnnualProfitInput",
                            event.target.value,
                          )
                        }
                        step="0.01"
                        type="number"
                        value={calculatorState.existingAnnualProfitInput}
                      />
                    </FieldLabel>
                  </div>

                  <TogglePanel
                    checked={calculatorState.includeIncomeTax}
                    description="Net kâr sonucuna tahmini vergi etkisini yansıtır."
                    info={
                      <p>
                        Ürün başı vergi öncesi kâr, tahmini satış adediyle
                        yıllıklaştırılır ve 2026 progresif gelir vergisi
                        tarifesine uygulanır. Sonuç ürün başına paylaştırılan
                        tahmini etkidir; kesin beyan veya tahakkuk tutarı
                        değildir.
                      </p>
                    }
                    label="Gelir vergisi etkisini göster"
                    onCheckedChange={(checked) =>
                      updateState("includeIncomeTax", checked)
                    }
                  />

                  <TogglePanel
                    checked={calculatorState.includeCompanyExpenses}
                    description="Aktif şirket giderlerinin ürün başı payını düşer."
                    info={
                      <p>
                        Aktif aylık giderler doğrudan, üç aylık giderler üçe,
                        yıllık giderler on ikiye bölünerek aylıklaştırılır.
                        Toplam tutar tahmini aylık satış adedine paylaştırılır.
                        Pasif ve tek seferlik giderler hesaba katılmaz.
                      </p>
                    }
                    label="Şirket gider payını dahil et"
                    onCheckedChange={(checked) =>
                      updateState("includeCompanyExpenses", checked)
                    }
                  />

                  <TogglePanel
                    checked={calculatorState.isImported}
                    description="Gümrük, ATR, navlun ve ithalat KDV alanlarını açar."
                    label="İthalat senaryosu"
                    onCheckedChange={(checked) =>
                      updateState("isImported", checked)
                    }
                  />

                  {calculatorState.isImported ? (
                    <details className="group rounded-2xl border border-border bg-surface-elevated">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-foreground">
                        Gelişmiş ithalat ayarları
                        <ChevronDown
                          className="size-4 group-open:hidden"
                          aria-hidden="true"
                        />
                        <ChevronUp
                          className="hidden size-4 group-open:block"
                          aria-hidden="true"
                        />
                      </summary>
                      <div className="space-y-4 border-t border-border p-4">
                        <FieldLabel>
                          Alış ülkesi
                          <Select
                            onValueChange={(value) => {
                              updateState(
                                "selectedCountryId",
                                value === "none" ? "" : value,
                              );
                              updateState("applyAtrAdvantage", false);
                            }}
                            value={
                              calculatorState.selectedCountryId || "none"
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Ülke seç" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Ülke yok</SelectItem>
                              {countries.map((country) => (
                                <SelectItem
                                  key={country.id}
                                  value={country.id}
                                >
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FieldLabel>

                        <label className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4 text-sm text-foreground">
                          <Checkbox
                            checked={calculatorState.applyAtrAdvantage}
                            disabled={!analysis?.selectedCountry?.has_atr}
                            onCheckedChange={(value) =>
                              updateState(
                                "applyAtrAdvantage",
                                value === true,
                              )
                            }
                          />
                          <span>
                            ATR gümrük vergisi avantajını uygula
                          </span>
                        </label>

                        <FieldLabel htmlFor="customs-base">
                          Gümrük matrahı override
                          <Input
                            id="customs-base"
                            min="0"
                            onChange={(event) =>
                              updateState(
                                "customsBaseInput",
                                event.target.value,
                              )
                            }
                            placeholder="Boşsa maliyet + navlun + sigorta"
                            step="0.01"
                            type="number"
                            value={calculatorState.customsBaseInput}
                          />
                        </FieldLabel>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <FieldLabel htmlFor="freight">
                            Navlun
                            <Input
                              id="freight"
                              min="0"
                              onChange={(event) =>
                                updateState(
                                  "freightInput",
                                  event.target.value,
                                )
                              }
                              step="0.01"
                              type="number"
                              value={calculatorState.freightInput}
                            />
                          </FieldLabel>
                          <FieldLabel htmlFor="insurance">
                            Sigorta
                            <Input
                              id="insurance"
                              min="0"
                              onChange={(event) =>
                                updateState(
                                  "insuranceInput",
                                  event.target.value,
                                )
                              }
                              step="0.01"
                              type="number"
                              value={calculatorState.insuranceInput}
                            />
                          </FieldLabel>
                          <FieldLabel htmlFor="broker">
                            Müşavir
                            <Input
                              id="broker"
                              min="0"
                              onChange={(event) =>
                                updateState(
                                  "customsBrokerInput",
                                  event.target.value,
                                )
                              }
                              step="0.01"
                              type="number"
                              value={calculatorState.customsBrokerInput}
                            />
                          </FieldLabel>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <label className="flex items-start gap-3 rounded-2xl border border-border bg-background p-3 text-sm text-foreground">
                            <Checkbox
                              checked={
                                calculatorState.importExpenseIncludesVat
                              }
                              onCheckedChange={(value) =>
                                updateState(
                                  "importExpenseIncludesVat",
                                  value === true,
                                )
                              }
                            />
                            <span>Giderler KDV dahil</span>
                          </label>
                          <label className="flex items-start gap-3 rounded-2xl border border-border bg-background p-3 text-sm text-foreground">
                            <Checkbox
                              checked={
                                calculatorState.importExpenseVatDeductible
                              }
                              onCheckedChange={(value) =>
                                updateState(
                                  "importExpenseVatDeductible",
                                  value === true,
                                )
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
                                updateState(
                                  "importExpenseVatRateInput",
                                  event.target.value,
                                )
                              }
                              step="0.01"
                              type="number"
                              value={
                                calculatorState.importExpenseVatRateInput
                              }
                            />
                          </FieldLabel>
                        </div>
                      </div>
                    </details>
                  ) : null}
                </CardContent>
              </Card>

              <div className="flex items-center justify-between gap-3 xl:col-span-2">
                <Button
                  onClick={() => setActiveStep(1)}
                  type="button"
                  variant="outline"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Geri
                </Button>
                <Button
                  disabled={!hasValidCosts}
                  onClick={() => setActiveStep(3)}
                  type="button"
                >
                  Sonuçları gör
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : null}

          {activeStep === 3 && analysis ? (
            <div className="space-y-5">
              <Card className="overflow-hidden">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-primary">
                      {analysis.marketplace}
                    </p>
                    <p className="mt-1 truncate text-lg font-semibold text-foreground">
                      {analysis.product.product_name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Komisyon %{analysis.commissionRate} · KDV %
                      {analysis.rates.vatRate}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      onClick={() => setActiveStep(2)}
                      type="button"
                      variant="outline"
                    >
                      <ArrowLeft className="size-4" aria-hidden="true" />
                      Düzenle
                    </Button>
                    <Button
                      disabled={
                        isSaving ||
                        !hasValidCosts ||
                        !snapshotStorageAvailable
                      }
                      onClick={handleSave}
                      type="button"
                    >
                      <Save className="size-4" aria-hidden="true" />
                      {isSaving ? "Kaydediliyor..." : "Analizi Kaydet"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {saveError ? (
                <div
                  className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-400/25 dark:bg-red-500/10 dark:text-red-200"
                  role="alert"
                >
                  {saveError}
                </div>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-3">
                {analysis.scenarios.map((scenario) => (
                  <ProfitScenarioCard
                    key={scenario.key}
                    result={scenario.result}
                    title={scenario.title}
                  />
                ))}
              </div>

              <ProfitWarnings warnings={analysis.warnings} />

              <Card>
                <CardHeader>
                  <CardTitle>Detaylı Kırılım</CardTitle>
                  <CardDescription>
                    Satış, KDV, ithalat, pazaryeri, operasyon ve gelir
                    vergisi kalemlerinin senaryo karşılaştırması.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfitBreakdownTable scenarios={analysis.scenarios} />
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="history">
          <ProfitHistory
            snapshots={localSnapshots}
            storageAvailable={snapshotStorageAvailable}
          />
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  );
}
