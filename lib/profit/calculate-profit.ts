import { calculateIncomeTaxPerProduct } from "@/lib/profit/income-tax";

export type ProfitStatus = "Kârlı" | "Riskli" | "Zarar";

export type ProfitCalculationInput = {
  additionalCustomsDutyRate: number;
  commissionRate: number;
  customsDutyRate: number;
  exciseTaxRate: number;
  grossSalePrice: number;
  includeIncomeTax: boolean;
  estimatedMonthlySales: number;
  operatingCostPerProduct: number;
  productCost: number;
  shippingCost: number;
  trtTaxRate: number;
  vatRate: number;
};

export type ProfitCalculationResult = {
  additionalCustomsDuty: number;
  customsDuty: number;
  estimatedIncomeTax: number;
  exciseTax: number;
  grossSalePrice: number;
  landedCost: number;
  marketplaceCommission: number;
  minimumSalePrice: number;
  netMargin: number;
  netProfit: number;
  operatingCostPerProduct: number;
  productCost: number;
  profitBeforeIncomeTax: number;
  roi: number;
  saleWithoutVat: number;
  shippingCost: number;
  status: ProfitStatus;
  trtTax: number;
};

function getStatus(netProfit: number, netMargin: number, roi: number): ProfitStatus {
  if (netProfit < 0) {
    return "Zarar";
  }

  if (netMargin < 10 || roi < 15) {
    return "Riskli";
  }

  return "Kârlı";
}

function getMinimumSalePrice({
  commissionRate,
  landedCost,
  operatingCostPerProduct,
  shippingCost,
  vatRate,
}: {
  commissionRate: number;
  landedCost: number;
  operatingCostPerProduct: number;
  shippingCost: number;
  vatRate: number;
}) {
  const denominator = 1 / (1 + vatRate / 100) - commissionRate / 100;

  if (denominator <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return (landedCost + shippingCost + operatingCostPerProduct) / denominator;
}

export function calculateProfit(
  input: ProfitCalculationInput,
): ProfitCalculationResult {
  const grossSalePrice = Math.max(0, input.grossSalePrice);
  const productCost = Math.max(0, input.productCost);
  const shippingCost = Math.max(0, input.shippingCost);
  const operatingCostPerProduct = Math.max(0, input.operatingCostPerProduct);
  const saleWithoutVat = grossSalePrice / (1 + Math.max(0, input.vatRate) / 100);
  const marketplaceCommission =
    grossSalePrice * (Math.max(0, input.commissionRate) / 100);
  const customsDuty = productCost * (Math.max(0, input.customsDutyRate) / 100);
  const additionalCustomsDuty =
    productCost * (Math.max(0, input.additionalCustomsDutyRate) / 100);
  const exciseTax =
    (productCost + customsDuty + additionalCustomsDuty) *
    (Math.max(0, input.exciseTaxRate) / 100);
  const trtTax = productCost * (Math.max(0, input.trtTaxRate) / 100);
  const landedCost =
    productCost + customsDuty + additionalCustomsDuty + exciseTax + trtTax;
  const profitBeforeIncomeTax =
    saleWithoutVat -
    landedCost -
    marketplaceCommission -
    shippingCost -
    operatingCostPerProduct;
  const estimatedIncomeTax = input.includeIncomeTax
    ? calculateIncomeTaxPerProduct({
        estimatedMonthlySales: input.estimatedMonthlySales,
        profitBeforeIncomeTaxPerProduct: profitBeforeIncomeTax,
      })
    : 0;
  const netProfit = profitBeforeIncomeTax - estimatedIncomeTax;
  const netMargin = grossSalePrice > 0 ? (netProfit / grossSalePrice) * 100 : 0;
  const roi = landedCost > 0 ? (netProfit / landedCost) * 100 : 0;
  const minimumSalePrice = getMinimumSalePrice({
    commissionRate: Math.max(0, input.commissionRate),
    landedCost,
    operatingCostPerProduct,
    shippingCost,
    vatRate: Math.max(0, input.vatRate),
  });

  return {
    additionalCustomsDuty,
    customsDuty,
    estimatedIncomeTax,
    exciseTax,
    grossSalePrice,
    landedCost,
    marketplaceCommission,
    minimumSalePrice,
    netMargin,
    netProfit,
    operatingCostPerProduct,
    productCost,
    profitBeforeIncomeTax,
    roi,
    saleWithoutVat,
    shippingCost,
    status: getStatus(netProfit, netMargin, roi),
    trtTax,
  };
}
