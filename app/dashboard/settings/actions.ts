"use server";

import { revalidatePath } from "next/cache";

import {
  commissionBases,
  expensePeriods,
  taxPeriods,
  taxTypes,
  type ActionState,
  type CommissionBase,
  type ExpensePeriod,
  type TaxPeriod,
  type TaxType,
} from "@/components/settings/types";
import {
  marketplaces,
  type Marketplace,
} from "@/components/product-pool/types";
import { createClient } from "@/lib/supabase/server";

const SETTINGS_PATH = "/dashboard/settings";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);

  return value || null;
}

function getAmount(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return 0;
  }

  const parsed = Number(value.replace(",", "."));

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getInteger(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function getPeriod(formData: FormData): ExpensePeriod {
  const period = getString(formData, "period");

  if (expensePeriods.includes(period as ExpensePeriod)) {
    return period as ExpensePeriod;
  }

  return "monthly";
}

function getTaxType(formData: FormData): TaxType {
  const taxType = getString(formData, "tax_type");

  if (taxTypes.includes(taxType as TaxType)) {
    return taxType as TaxType;
  }

  return "other";
}

function getTaxPeriod(formData: FormData): TaxPeriod {
  const period = getString(formData, "period");

  if (taxPeriods.includes(period as TaxPeriod)) {
    return period as TaxPeriod;
  }

  return "monthly";
}

function getMarketplace(formData: FormData): Marketplace {
  const marketplace = getString(formData, "marketplace");

  if (marketplaces.includes(marketplace as Marketplace)) {
    return marketplace as Marketplace;
  }

  return "Trendyol";
}

function getCommissionBase(formData: FormData): CommissionBase {
  const commissionBase = getString(formData, "commission_base");

  if (commissionBases.includes(commissionBase as CommissionBase)) {
    return commissionBase as CommissionBase;
  }

  return "gross_sale_price";
}

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Oturum bulunamadi.");
  }

  return {
    supabase,
    user,
  };
}

function getCompanyExpensePayload(formData: FormData) {
  const name = getString(formData, "name");

  if (!name) {
    throw new Error("Gider adi zorunludur.");
  }

  return {
    amount: getAmount(formData, "amount"),
    amount_includes_vat: getBoolean(formData, "amount_includes_vat"),
    is_active: getBoolean(formData, "is_active"),
    name,
    notes: getNullableString(formData, "notes"),
    period: getPeriod(formData),
    vat_deductible: getBoolean(formData, "vat_deductible"),
    vat_rate: getAmount(formData, "vat_rate"),
  };
}

function getCountryPayload(formData: FormData) {
  const name = getString(formData, "name");

  if (!name) {
    throw new Error("Ulke adi zorunludur.");
  }

  const code = getString(formData, "code").toUpperCase();

  return {
    code: code || null,
    has_atr: getBoolean(formData, "has_atr"),
    name,
    notes: getNullableString(formData, "notes"),
  };
}

function getTaxSettingPayload(formData: FormData) {
  const name = getString(formData, "name");

  if (!name) {
    throw new Error("Vergi adi zorunludur.");
  }

  return {
    fixed_amount: getAmount(formData, "fixed_amount"),
    is_active: getBoolean(formData, "is_active"),
    name,
    notes: getNullableString(formData, "notes"),
    period: getTaxPeriod(formData),
    rate: getAmount(formData, "rate"),
    tax_type: getTaxType(formData),
  };
}

function getMarketplaceSettingPayload(formData: FormData) {
  return {
    commission_base: getCommissionBase(formData),
    default_commission_includes_vat: getBoolean(
      formData,
      "default_commission_includes_vat",
    ),
    default_commission_rate: getAmount(formData, "default_commission_rate"),
    default_commission_vat_rate: getAmount(
      formData,
      "default_commission_vat_rate",
    ),
    default_shipping_cost: getAmount(formData, "default_shipping_cost"),
    default_shipping_includes_vat: getBoolean(
      formData,
      "default_shipping_includes_vat",
    ),
    default_shipping_vat_rate: getAmount(formData, "default_shipping_vat_rate"),
    is_active: getBoolean(formData, "is_active"),
    marketplace: getMarketplace(formData),
    payment_term_days: getInteger(formData, "payment_term_days") || 28,
    service_fee: getAmount(formData, "service_fee"),
    service_fee_includes_vat: getBoolean(formData, "service_fee_includes_vat"),
    service_fee_vat_rate: getAmount(formData, "service_fee_vat_rate"),
  };
}

export async function createCountry(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let payload: ReturnType<typeof getCountryPayload>;

  try {
    payload = getCountryPayload(formData);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Ulke eklenemedi.",
      ok: false,
    };
  }

  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase.from("countries").insert({
    ...payload,
    user_id: user.id,
  });

  if (error) {
    return {
      error: `Ulke eklenemedi: ${error.message}`,
      ok: false,
    };
  }

  revalidatePath(SETTINGS_PATH);

  return { ok: true };
}

export async function updateCountry(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = getString(formData, "id");

  if (!id) {
    return {
      error: "Guncellenecek ulke bulunamadi.",
      ok: false,
    };
  }

  let payload: ReturnType<typeof getCountryPayload>;

  try {
    payload = getCountryPayload(formData);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Ulke guncellenemedi.",
      ok: false,
    };
  }

  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("countries")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return {
      error: `Ulke guncellenemedi: ${error.message}`,
      ok: false,
    };
  }

  revalidatePath(SETTINGS_PATH);

  return { ok: true };
}

export async function deleteCountry(formData: FormData) {
  const id = getString(formData, "id");

  if (!id) {
    throw new Error("Silinecek ulke bulunamadi.");
  }

  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("countries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Ulke silinemedi: ${error.message}`);
  }

  revalidatePath(SETTINGS_PATH);
}

export async function createTaxSetting(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let payload: ReturnType<typeof getTaxSettingPayload>;

  try {
    payload = getTaxSettingPayload(formData);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Vergi eklenemedi.",
      ok: false,
    };
  }

  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase.from("tax_settings").insert({
    ...payload,
    user_id: user.id,
  });

  if (error) {
    return {
      error: `Vergi eklenemedi: ${error.message}`,
      ok: false,
    };
  }

  revalidatePath(SETTINGS_PATH);

  return { ok: true };
}

export async function updateTaxSetting(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = getString(formData, "id");

  if (!id) {
    return {
      error: "Guncellenecek vergi ayari bulunamadi.",
      ok: false,
    };
  }

  let payload: ReturnType<typeof getTaxSettingPayload>;

  try {
    payload = getTaxSettingPayload(formData);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Vergi guncellenemedi.",
      ok: false,
    };
  }

  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("tax_settings")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return {
      error: `Vergi guncellenemedi: ${error.message}`,
      ok: false,
    };
  }

  revalidatePath(SETTINGS_PATH);

  return { ok: true };
}

export async function deleteTaxSetting(formData: FormData) {
  const id = getString(formData, "id");

  if (!id) {
    throw new Error("Silinecek vergi ayari bulunamadi.");
  }

  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("tax_settings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Vergi silinemedi: ${error.message}`);
  }

  revalidatePath(SETTINGS_PATH);
}

export async function createCompanyExpense(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let payload: ReturnType<typeof getCompanyExpensePayload>;

  try {
    payload = getCompanyExpensePayload(formData);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Gider eklenemedi.",
      ok: false,
    };
  }

  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase.from("company_expenses").insert({
    ...payload,
    user_id: user.id,
  });

  if (error) {
    return {
      error: `Gider eklenemedi: ${error.message}`,
      ok: false,
    };
  }

  revalidatePath(SETTINGS_PATH);

  return { ok: true };
}

export async function updateCompanyExpense(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = getString(formData, "id");

  if (!id) {
    return {
      error: "Guncellenecek gider bulunamadi.",
      ok: false,
    };
  }

  let payload: ReturnType<typeof getCompanyExpensePayload>;

  try {
    payload = getCompanyExpensePayload(formData);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Gider guncellenemedi.",
      ok: false,
    };
  }

  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("company_expenses")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return {
      error: `Gider guncellenemedi: ${error.message}`,
      ok: false,
    };
  }

  revalidatePath(SETTINGS_PATH);

  return { ok: true };
}

export async function deleteCompanyExpense(formData: FormData) {
  const id = getString(formData, "id");

  if (!id) {
    throw new Error("Silinecek gider bulunamadi.");
  }

  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("company_expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Gider silinemedi: ${error.message}`);
  }

  revalidatePath(SETTINGS_PATH);
}

export async function saveMarketplaceSetting(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = getString(formData, "id");
  const payload = getMarketplaceSettingPayload(formData);
  const { supabase, user } = await getAuthenticatedClient();
  const query = id
    ? supabase
        .from("marketplace_settings")
        .update(payload)
        .eq("id", id)
        .eq("user_id", user.id)
    : supabase.from("marketplace_settings").insert({
        ...payload,
        user_id: user.id,
      });

  const { error } = await query;

  if (error) {
    return {
      error: `Pazaryeri ayari kaydedilemedi: ${error.message}`,
      ok: false,
    };
  }

  revalidatePath(SETTINGS_PATH);
  revalidatePath("/calculate/profit");

  return { ok: true };
}
