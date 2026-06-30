import { calculateIncomeTaxPerProduct } from "./income-tax";

export type ProfitStatus = "Kârlı" | "Riskli" | "Zarar";

export type CommissionBase = "gross_sale_price" | "net_sale_price";

export type VatAmountInput = {
  amount: number;
  deductibleVat: boolean;
  includesVat: boolean;
  precomputed?: VatBreakdown;
  vatRate: number;
};

export type VatBreakdown = {
  deductibleVat: number;
  grossAmount: number;
  netAmount: number;
  profitCost: number;
  vatAmount: number;
};

export type ProfitExpenseGroup =
  | "import"
  | "marketplace"
  | "operation"
  | "company";

export type ProfitExpenseBreakdown = VatBreakdown & {
  group: ProfitExpenseGroup;
  key: string;
  label: string;
};

export type TaxCashFlowItem = {
  amount: number;
  label: string;
  timing: string;
};

export type ProfitCalculationInput = {
  additionalCustomsDutyRate: number;
  applyAtrAdvantage: boolean;
  customsBaseOverride: number;
  customsBrokerCost: VatAmountInput;
  customsDutyRate: number;
  domesticShippingCost: VatAmountInput;
  estimatedMonthlySales: number;
  existingAnnualProfit: number;
  exciseTaxRate: number;
  freightCost: VatAmountInput;
  grossSalePrice: number;
  includeIncomeTax: boolean;
  insuranceCost: VatAmountInput;
  isImported: boolean;
  marketplaceCommissionBase: CommissionBase;
  marketplaceCommissionIncludesVat: boolean;
  marketplaceCommissionRate: number;
  marketplaceCommissionVatRate: number;
  marketplaceServiceFee: VatAmountInput;
  purchasePrice: number;
  purchasePriceIncludesVat: boolean;
  purchaseVatRate: number;
  saleVatRate: number;
  companyExpenseShare: VatAmountInput;
  trtTaxRate: number;
};

export type ProfitCalculationResult = {
  additionalCustomsDuty: number;
  carriedVat: number;
  customsBase: number;
  customsBrokerCost: number;
  customsDuty: number;
  deductibleVatFromExpenses: number;
  domesticShippingCost: number;
  estimatedIncomeTax: number;
  exciseTax: number;
  expenseBreakdown: ProfitExpenseBreakdown[];
  grossSalePrice: number;
  importVat: number;
  inputVatFromPurchase: number;
  inputVatTotal: number;
  insuranceCost: number;
  landedCost: number;
  marketplaceCommission: number;
  marketplaceCommissionTotal: number;
  marketplaceCommissionVat: number;
  marketplaceNetFees: number;
  minimumSalePrice: number;
  netMargin: number;
  netProfit: number;
  operationNetCosts: number;
  outputVat: number;
  profitBeforeIncomeTax: number;
  purchaseGross: number;
  purchaseNet: number;
  roi: number;
  saleNet: number;
  shippingCost: number;
  status: ProfitStatus;
  taxCashFlow: TaxCashFlowItem[];
  trtTax: number;
  vatPayable: number;
};

function safeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function positive(value: number) {
  return Math.max(0, safeNumber(value));
}

export function splitVat({
  amount,
  deductibleVat,
  includesVat,
  precomputed,
  vatRate,
}: VatAmountInput): VatBreakdown {
  if (precomputed) {
    return precomputed;
  }

  const safeAmount = positive(amount);
  const safeVatRate = positive(vatRate);
  const divisor = 1 + safeVatRate / 100;
  const netAmount = includesVat && divisor > 0 ? safeAmount / divisor : safeAmount;
  const vatAmount = includesVat
    ? safeAmount - netAmount
    : netAmount * (safeVatRate / 100);
  const grossAmount = includesVat ? safeAmount : netAmount + vatAmount;
  const inputVat = deductibleVat ? vatAmount : 0;

  return {
    deductibleVat: inputVat,
    grossAmount,
    netAmount,
    profitCost: deductibleVat ? netAmount : grossAmount,
    vatAmount,
  };
}

function getStatus(netProfit: number, netMargin: number, roi: number): ProfitStatus {
  if (netProfit < 0) {
    return "Zarar";
  }

  if (netMargin < 10 || roi < 15) {
    return "Riskli";
  }

  return "Kârlı";
}

function asExpense(
  key: string,
  label: string,
  group: ProfitExpenseGroup,
  input: VatAmountInput,
): ProfitExpenseBreakdown {
  return {
    ...splitVat(input),
    group,
    key,
    label,
  };
}

function getTaxCashFlow({
  carriedVat,
  estimatedIncomeTax,
  estimatedMonthlySales,
  vatPayable,
}: {
  carriedVat: number;
  estimatedIncomeTax: number;
  estimatedMonthlySales: number;
  vatPayable: number;
}): TaxCashFlowItem[] {
  const monthlySales = Math.max(1, Math.round(positive(estimatedMonthlySales)));
  const items: TaxCashFlowItem[] = [];

  if (vatPayable > 0) {
    items.push({
      amount: vatPayable * monthlySales,
      label: "KDV ödemesi",
      timing: "Aylık KDV beyannamesi / sonraki dönem",
    });
  }

  if (carriedVat > 0) {
    items.push({
      amount: carriedVat * monthlySales,
      label: "Devreden KDV",
      timing: "Sonraki KDV dönemlerine taşınır",
    });
  }

  if (estimatedIncomeTax > 0) {
    const annualImpact = estimatedIncomeTax * monthlySales * 12;
    const provisionalShare = annualImpact / 4;
    const annualBalanceShare = (annualImpact - provisionalShare * 3) / 2;

    items.push(
      {
        amount: provisionalShare,
        label: "Geçici vergi 1. dönem",
        timing: "Tahmini dönemsel avans",
      },
      {
        amount: provisionalShare,
        label: "Geçici vergi 2. dönem",
        timing: "Tahmini dönemsel avans",
      },
      {
        amount: provisionalShare,
        label: "Geçici vergi 3. dönem",
        timing: "Tahmini dönemsel avans",
      },
      {
        amount: annualBalanceShare,
        label: "Yıllık gelir vergisi Mart",
        timing: "Tahmini yıllık beyan taksiti",
      },
      {
        amount: annualBalanceShare,
        label: "Yıllık gelir vergisi Temmuz",
        timing: "Tahmini yıllık beyan taksiti",
      },
    );
  }

  return items;
}

function calculateProfitCore(input: ProfitCalculationInput) {
  const grossSalePrice = positive(input.grossSalePrice);
  const purchasePrice = positive(input.purchasePrice);
  const saleVatRate = positive(input.saleVatRate);
  const saleNet = grossSalePrice / (1 + saleVatRate / 100);
  const outputVat = grossSalePrice - saleNet;
  const purchase = input.isImported
    ? {
        deductibleVat: 0,
        grossAmount: purchasePrice,
        netAmount: purchasePrice,
        profitCost: purchasePrice,
        vatAmount: 0,
      }
    : splitVat({
        amount: purchasePrice,
        deductibleVat: true,
        includesVat: input.purchasePriceIncludesVat,
        vatRate: input.purchaseVatRate,
      });
  const customsBroker = asExpense(
    "customsBroker",
    "Gümrük müşavirliği",
    "import",
    input.customsBrokerCost,
  );
  const freight = asExpense("freight", "Navlun", "import", input.freightCost);
  const insurance = asExpense("insurance", "Sigorta", "import", input.insuranceCost);
  const domesticShipping = asExpense(
    "domesticShipping",
    "Kargo",
    "operation",
    input.domesticShippingCost,
  );
  const marketplaceService = asExpense(
    "marketplaceService",
    "Pazaryeri hizmet bedeli",
    "marketplace",
    input.marketplaceServiceFee,
  );
  const companyExpense = asExpense(
    "companyExpense",
    "Şirket gider payı",
    "company",
    input.companyExpenseShare,
  );
  const customsBase = input.isImported
    ? positive(input.customsBaseOverride) ||
      purchase.netAmount + freight.netAmount + insurance.netAmount
    : 0;
  const customsDutyRate =
    input.isImported && input.applyAtrAdvantage ? 0 : positive(input.customsDutyRate);
  const customsDuty = customsBase * (customsDutyRate / 100);
  const additionalCustomsDuty =
    customsBase * (positive(input.additionalCustomsDutyRate) / 100);
  const exciseTax =
    (customsBase + customsDuty + additionalCustomsDuty) *
    (positive(input.exciseTaxRate) / 100);
  const trtTax = customsBase * (positive(input.trtTaxRate) / 100);
  const importVat = input.isImported
    ? (customsBase +
        customsDuty +
        additionalCustomsDuty +
        exciseTax +
        trtTax) *
      (positive(input.purchaseVatRate) / 100)
    : 0;
  const landedCost =
    purchase.netAmount +
    customsDuty +
    additionalCustomsDuty +
    exciseTax +
    trtTax +
    customsBroker.profitCost +
    freight.profitCost +
    insurance.profitCost;
  const commissionBase =
    input.marketplaceCommissionBase === "net_sale_price"
      ? saleNet
      : grossSalePrice;
  const marketplaceCommission = splitVat({
    amount: commissionBase * (positive(input.marketplaceCommissionRate) / 100),
    deductibleVat: true,
    includesVat: input.marketplaceCommissionIncludesVat,
    vatRate: input.marketplaceCommissionVatRate,
  });
  const marketplaceCommissionExpense: ProfitExpenseBreakdown = {
    ...marketplaceCommission,
    group: "marketplace",
    key: "marketplaceCommission",
    label: "Pazaryeri komisyonu",
  };
  const expenseBreakdown = [
    marketplaceCommissionExpense,
    marketplaceService,
    domesticShipping,
    customsBroker,
    freight,
    insurance,
    companyExpense,
  ];
  const marketplaceNetFees =
    marketplaceCommission.profitCost + marketplaceService.profitCost;
  const operationNetCosts = domesticShipping.profitCost;
  const deductibleVatFromExpenses = expenseBreakdown.reduce(
    (total, expense) => total + expense.deductibleVat,
    0,
  );
  const inputVatTotal =
    purchase.deductibleVat + importVat + deductibleVatFromExpenses;
  const vatPayable = Math.max(outputVat - inputVatTotal, 0);
  const carriedVat = Math.max(inputVatTotal - outputVat, 0);
  const profitBeforeIncomeTax =
    saleNet -
    landedCost -
    marketplaceNetFees -
    operationNetCosts -
    companyExpense.profitCost;
  const estimatedIncomeTax = input.includeIncomeTax
    ? calculateIncomeTaxPerProduct({
        estimatedMonthlySales: Math.max(1, positive(input.estimatedMonthlySales)),
        existingAnnualProfit: positive(input.existingAnnualProfit),
        profitBeforeIncomeTaxPerProduct: profitBeforeIncomeTax,
      })
    : 0;
  const netProfit = profitBeforeIncomeTax - estimatedIncomeTax;
  const netMargin = grossSalePrice > 0 ? (netProfit / grossSalePrice) * 100 : 0;
  const roi = landedCost > 0 ? (netProfit / landedCost) * 100 : 0;
  const taxCashFlow = getTaxCashFlow({
    carriedVat,
    estimatedIncomeTax,
    estimatedMonthlySales: input.estimatedMonthlySales,
    vatPayable,
  });

  return {
    additionalCustomsDuty,
    carriedVat,
    customsBase,
    customsBrokerCost: customsBroker.profitCost,
    customsDuty,
    deductibleVatFromExpenses,
    domesticShippingCost: domesticShipping.profitCost,
    estimatedIncomeTax,
    exciseTax,
    expenseBreakdown,
    grossSalePrice,
    importVat,
    inputVatFromPurchase: purchase.deductibleVat,
    inputVatTotal,
    insuranceCost: insurance.profitCost,
    landedCost,
    marketplaceCommission: marketplaceCommission.profitCost,
    marketplaceCommissionTotal: marketplaceCommission.grossAmount,
    marketplaceCommissionVat: marketplaceCommission.vatAmount,
    marketplaceNetFees,
    netMargin,
    netProfit,
    operationNetCosts,
    outputVat,
    profitBeforeIncomeTax,
    purchaseGross: purchase.grossAmount,
    purchaseNet: purchase.netAmount,
    roi,
    saleNet,
    shippingCost: domesticShipping.profitCost,
    status: getStatus(netProfit, netMargin, roi),
    taxCashFlow,
    trtTax,
    vatPayable,
  };
}

function getMinimumSalePrice(input: ProfitCalculationInput) {
  const zeroResult = calculateProfitCore({
    ...input,
    grossSalePrice: 0,
  });

  if (zeroResult.netProfit >= 0) {
    return 0;
  }

  let high = Math.max(1, input.grossSalePrice);

  for (let index = 0; index < 80; index += 1) {
    const result = calculateProfitCore({
      ...input,
      grossSalePrice: high,
    });

    if (result.netProfit >= 0) {
      break;
    }

    high *= 2;

    if (high > 1_000_000_000) {
      return Number.POSITIVE_INFINITY;
    }
  }

  let low = 0;

  for (let index = 0; index < 80; index += 1) {
    const mid = (low + high) / 2;
    const result = calculateProfitCore({
      ...input,
      grossSalePrice: mid,
    });

    if (result.netProfit >= 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return high;
}

export function calculateProfit(
  input: ProfitCalculationInput,
): ProfitCalculationResult {
  const result = calculateProfitCore(input);

  return {
    ...result,
    minimumSalePrice: getMinimumSalePrice(input),
  };
}
