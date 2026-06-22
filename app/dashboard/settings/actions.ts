"use server";

import { revalidatePath } from "next/cache";

import {
  expensePeriods,
  type ActionState,
  type ExpensePeriod,
} from "@/components/settings/types";
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

function getPeriod(formData: FormData): ExpensePeriod {
  const period = getString(formData, "period");

  if (expensePeriods.includes(period as ExpensePeriod)) {
    return period as ExpensePeriod;
  }

  return "monthly";
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
    is_active: getBoolean(formData, "is_active"),
    name,
    notes: getNullableString(formData, "notes"),
    period: getPeriod(formData),
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
