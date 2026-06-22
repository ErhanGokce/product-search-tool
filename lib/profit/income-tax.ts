const incomeTaxBrackets = [
  {
    baseTax: 0,
    lowerLimit: 0,
    rate: 0.15,
    upperLimit: 190_000,
  },
  {
    baseTax: 28_500,
    lowerLimit: 190_000,
    rate: 0.2,
    upperLimit: 400_000,
  },
  {
    baseTax: 70_500,
    lowerLimit: 400_000,
    rate: 0.27,
    upperLimit: 1_000_000,
  },
  {
    baseTax: 232_500,
    lowerLimit: 1_000_000,
    rate: 0.35,
    upperLimit: 5_300_000,
  },
  {
    baseTax: 1_737_500,
    lowerLimit: 5_300_000,
    rate: 0.4,
    upperLimit: Number.POSITIVE_INFINITY,
  },
] as const;

export function calculateProgressiveIncomeTax(annualProfit: number): number {
  if (annualProfit <= 0 || !Number.isFinite(annualProfit)) {
    return 0;
  }

  const bracket =
    incomeTaxBrackets.find((item) => annualProfit <= item.upperLimit) ??
    incomeTaxBrackets[incomeTaxBrackets.length - 1];

  return bracket.baseTax + (annualProfit - bracket.lowerLimit) * bracket.rate;
}

export function calculateIncomeTaxPerProduct({
  estimatedMonthlySales,
  profitBeforeIncomeTaxPerProduct,
}: {
  estimatedMonthlySales: number;
  profitBeforeIncomeTaxPerProduct: number;
}): number {
  if (
    profitBeforeIncomeTaxPerProduct <= 0 ||
    estimatedMonthlySales <= 0 ||
    !Number.isFinite(profitBeforeIncomeTaxPerProduct) ||
    !Number.isFinite(estimatedMonthlySales)
  ) {
    return 0;
  }

  const annualSalesCount = estimatedMonthlySales * 12;
  const annualProfit = profitBeforeIncomeTaxPerProduct * annualSalesCount;
  const annualIncomeTax = calculateProgressiveIncomeTax(annualProfit);

  return annualIncomeTax / annualSalesCount;
}
