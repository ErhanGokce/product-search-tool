export const expensePeriods = [
  "monthly",
  "quarterly",
  "yearly",
  "one_time",
] as const;

export type ExpensePeriod = (typeof expensePeriods)[number];

export const taxTypes = [
  "income_tax",
  "provisional_tax",
  "stamp_tax",
  "withholding_tax",
  "corporate_tax",
  "other",
] as const;

export type TaxType = (typeof taxTypes)[number];

export const taxPeriods = [
  "monthly",
  "quarterly",
  "yearly",
  "per_declaration",
] as const;

export type TaxPeriod = (typeof taxPeriods)[number];

export const commissionBases = [
  "gross_sale_price",
  "net_sale_price",
] as const;

export type CommissionBase = (typeof commissionBases)[number];

export type CompanyExpense = {
  amount: number | string;
  amount_includes_vat?: boolean | null;
  created_at: string | null;
  id: string;
  is_active: boolean | null;
  name: string;
  notes: string | null;
  period: ExpensePeriod | string;
  user_id: string | null;
  vat_deductible?: boolean | null;
  vat_rate?: number | string | null;
};

export type TaxSetting = {
  created_at: string | null;
  fixed_amount: number | string | null;
  id: string;
  is_active: boolean | null;
  name: string;
  notes: string | null;
  period: TaxPeriod | string | null;
  rate: number | string | null;
  tax_type: TaxType | string;
  user_id: string | null;
};

export type MarketplaceSetting = {
  commission_base?: CommissionBase | string | null;
  created_at: string | null;
  default_commission_rate: number | string | null;
  default_commission_includes_vat?: boolean | null;
  default_commission_vat_rate?: number | string | null;
  default_shipping_cost: number | string | null;
  default_shipping_includes_vat?: boolean | null;
  default_shipping_vat_rate?: number | string | null;
  id: string;
  is_active: boolean | null;
  marketplace: string;
  payment_term_days: number | null;
  service_fee: number | string | null;
  service_fee_includes_vat?: boolean | null;
  service_fee_vat_rate?: number | string | null;
  user_id: string | null;
};

export type CountrySetting = {
  code: string | null;
  created_at: string | null;
  has_atr: boolean | null;
  id: string;
  name: string;
  notes: string | null;
  user_id: string | null;
};

export type ActionState = {
  error?: string;
  ok: boolean;
};
