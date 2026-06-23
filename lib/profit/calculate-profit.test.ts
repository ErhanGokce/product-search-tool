import { describe, expect, it } from "vitest";

import {
  calculateProfit,
  splitVat,
  type ProfitCalculationInput,
  type VatAmountInput,
} from "./calculate-profit";
import {
  calculateIncrementalIncomeTax,
  calculateProgressiveIncomeTax,
} from "./income-tax";

function vatInput(
  amount = 0,
  includesVat = false,
  vatRate = 20,
  deductibleVat = true,
): VatAmountInput {
  return {
    amount,
    deductibleVat,
    includesVat,
    vatRate,
  };
}

function baseInput(
  overrides: Partial<ProfitCalculationInput> = {},
): ProfitCalculationInput {
  return {
    additionalCustomsDutyRate: 0,
    applyAtrAdvantage: false,
    companyExpenseShare: vatInput(0, false, 0, false),
    customsBaseOverride: 0,
    customsBrokerCost: vatInput(),
    customsDutyRate: 0,
    domesticShippingCost: vatInput(),
    estimatedMonthlySales: 100,
    existingAnnualProfit: 0,
    exciseTaxRate: 0,
    freightCost: vatInput(),
    grossSalePrice: 1_200,
    includeIncomeTax: false,
    insuranceCost: vatInput(),
    isImported: false,
    marketplaceCommissionBase: "gross_sale_price",
    marketplaceCommissionIncludesVat: false,
    marketplaceCommissionRate: 0,
    marketplaceCommissionVatRate: 20,
    marketplaceServiceFee: vatInput(),
    packagingCost: vatInput(),
    purchasePrice: 600,
    purchasePriceIncludesVat: true,
    purchaseVatRate: 20,
    saleVatRate: 20,
    trtTaxRate: 0,
    ...overrides,
  };
}

describe("splitVat", () => {
  it("splits included VAT and keeps deductible VAT out of profit cost", () => {
    expect(splitVat(vatInput(120, true, 20, true))).toMatchObject({
      deductibleVat: 20,
      grossAmount: 120,
      netAmount: 100,
      profitCost: 100,
      vatAmount: 20,
    });
  });

  it("keeps non-deductible VAT inside profit cost", () => {
    expect(splitVat(vatInput(100, false, 20, false))).toMatchObject({
      deductibleVat: 0,
      grossAmount: 120,
      netAmount: 100,
      profitCost: 120,
      vatAmount: 20,
    });
  });
});

describe("calculateProfit", () => {
  it("separates sale VAT, purchase VAT and payable VAT", () => {
    const result = calculateProfit(baseInput());

    expect(result.saleNet).toBeCloseTo(1_000);
    expect(result.outputVat).toBeCloseTo(200);
    expect(result.purchaseNet).toBeCloseTo(500);
    expect(result.inputVatFromPurchase).toBeCloseTo(100);
    expect(result.vatPayable).toBeCloseTo(100);
    expect(result.carriedVat).toBeCloseTo(0);
    expect(result.profitBeforeIncomeTax).toBeCloseTo(500);
  });

  it("shows carried VAT when input VAT is higher than output VAT", () => {
    const result = calculateProfit(
      baseInput({
        grossSalePrice: 600,
        purchasePrice: 1_200,
      }),
    );

    expect(result.outputVat).toBeCloseTo(100);
    expect(result.inputVatFromPurchase).toBeCloseTo(200);
    expect(result.vatPayable).toBeCloseTo(0);
    expect(result.carriedVat).toBeCloseTo(100);
  });

  it("supports gross and net sale price commission bases", () => {
    const grossBase = calculateProfit(
      baseInput({
        marketplaceCommissionBase: "gross_sale_price",
        marketplaceCommissionRate: 10,
      }),
    );
    const netBase = calculateProfit(
      baseInput({
        marketplaceCommissionBase: "net_sale_price",
        marketplaceCommissionRate: 10,
      }),
    );

    expect(grossBase.marketplaceCommission).toBeCloseTo(120);
    expect(grossBase.marketplaceCommissionVat).toBeCloseTo(24);
    expect(netBase.marketplaceCommission).toBeCloseTo(100);
    expect(netBase.marketplaceCommissionVat).toBeCloseTo(20);
  });

  it("splits commission VAT when commission amount already includes VAT", () => {
    const result = calculateProfit(
      baseInput({
        marketplaceCommissionIncludesVat: true,
        marketplaceCommissionRate: 10,
      }),
    );

    expect(result.marketplaceCommissionTotal).toBeCloseTo(120);
    expect(result.marketplaceCommission).toBeCloseTo(100);
    expect(result.marketplaceCommissionVat).toBeCloseTo(20);
  });

  it("applies ATR only to base customs duty and keeps additional duties", () => {
    const withoutAtr = calculateProfit(
      baseInput({
        additionalCustomsDutyRate: 5,
        customsDutyRate: 10,
        freightCost: vatInput(100, false, 0, false),
        isImported: true,
        purchasePrice: 1_000,
      }),
    );
    const withAtr = calculateProfit(
      baseInput({
        additionalCustomsDutyRate: 5,
        applyAtrAdvantage: true,
        customsDutyRate: 10,
        freightCost: vatInput(100, false, 0, false),
        isImported: true,
        purchasePrice: 1_000,
      }),
    );

    expect(withoutAtr.customsBase).toBeCloseTo(1_100);
    expect(withoutAtr.customsDuty).toBeCloseTo(110);
    expect(withoutAtr.additionalCustomsDuty).toBeCloseTo(55);
    expect(withAtr.customsDuty).toBeCloseTo(0);
    expect(withAtr.additionalCustomsDuty).toBeCloseTo(55);
    expect(withoutAtr.landedCost - withAtr.landedCost).toBeCloseTo(110);
  });

  it("does not double-count deductible expense VAT as profit cost", () => {
    const deductible = calculateProfit(
      baseInput({
        packagingCost: vatInput(120, true, 20, true),
      }),
    );
    const nonDeductible = calculateProfit(
      baseInput({
        packagingCost: vatInput(120, true, 20, false),
      }),
    );

    expect(deductible.packagingCost).toBeCloseTo(100);
    expect(deductible.deductibleVatFromExpenses).toBeCloseTo(20);
    expect(nonDeductible.packagingCost).toBeCloseTo(120);
    expect(nonDeductible.deductibleVatFromExpenses).toBeCloseTo(0);
  });

  it("finds a minimum sale price with the same calculation engine", () => {
    const result = calculateProfit(
      baseInput({
        includeIncomeTax: true,
        marketplaceCommissionRate: 12,
        packagingCost: vatInput(60, true, 20, true),
      }),
    );
    const atMinimum = calculateProfit({
      ...baseInput({
        includeIncomeTax: true,
        marketplaceCommissionRate: 12,
        packagingCost: vatInput(60, true, 20, true),
      }),
      grossSalePrice: result.minimumSalePrice,
    });

    expect(atMinimum.netProfit).toBeGreaterThanOrEqual(-0.01);
    expect(atMinimum.netProfit).toBeLessThan(0.01);
  });
});

describe("income tax", () => {
  it("uses the 2026 progressive income tax brackets", () => {
    expect(calculateProgressiveIncomeTax(190_000)).toBeCloseTo(28_500);
    expect(calculateProgressiveIncomeTax(400_000)).toBeCloseTo(70_500);
  });

  it("calculates incremental tax above existing annual profit", () => {
    expect(
      calculateIncrementalIncomeTax({
        annualProfit: 10_000,
        existingAnnualProfit: 190_000,
      }),
    ).toBeCloseTo(2_000);
  });
});
