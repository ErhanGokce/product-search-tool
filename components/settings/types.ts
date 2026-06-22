export const expensePeriods = [
  "monthly",
  "quarterly",
  "yearly",
  "one_time",
] as const;

export type ExpensePeriod = (typeof expensePeriods)[number];

export type CompanyExpense = {
  amount: number | string;
  created_at: string | null;
  id: string;
  is_active: boolean | null;
  name: string;
  notes: string | null;
  period: ExpensePeriod | string;
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
