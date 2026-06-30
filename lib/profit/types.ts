import type { Marketplace } from "@/components/product-pool/types";
import type {
  ProfitCalculationResult,
  ProfitStatus,
} from "@/lib/profit/calculate-profit";

export type ProfitScenarioKey = "normal" | "discounted" | "estimated";

export type ProfitScenario = {
  key: ProfitScenarioKey;
  result: ProfitCalculationResult;
  title: string;
};

export type ProfitCalculatorState = {
  applyAtrAdvantage: boolean;
  customsBaseInput: string;
  customsBrokerInput: string;
  estimatedPriceInput: string;
  existingAnnualProfitInput: string;
  freightInput: string;
  importExpenseIncludesVat: boolean;
  importExpenseVatDeductible: boolean;
  importExpenseVatRateInput: string;
  includeCompanyExpenses: boolean;
  includeIncomeTax: boolean;
  insuranceInput: string;
  isImported: boolean;
  marketplace: Marketplace;
  monthlySalesInput: string;
  purchaseIncludesVat: boolean;
  purchasePriceInput: string;
  purchaseVatRateInput: string;
  selectedCountryId: string;
  selectedProductId: string;
  shippingCostInput: string;
  useProductPrice: boolean;
};

export type EffectiveProfitRates = {
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

export type ProfitSnapshotInput = {
  categoryName: string | null;
  commissionRate: number;
  effectiveRates: EffectiveProfitRates;
  marketplaceSettingId: string | null;
  state: ProfitCalculatorState;
  subCategoryName: string | null;
};

export type ProfitSnapshot = {
  created_at: string;
  gross_sale_price: number | string;
  id: string;
  input_snapshot: ProfitSnapshotInput;
  marketplace: Marketplace;
  net_margin: number | string;
  net_profit: number | string;
  primary_scenario: ProfitScenarioKey;
  product_id: string;
  product_name: string;
  roi: number | string;
  scenarios_snapshot: ProfitScenario[];
  status: ProfitStatus;
  user_id: string;
  warnings: string[];
};

export type SaveProfitSnapshotResult = {
  error?: string;
  ok: boolean;
  snapshot?: ProfitSnapshot;
};
