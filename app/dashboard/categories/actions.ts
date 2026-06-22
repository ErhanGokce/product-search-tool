"use server";

import { revalidatePath } from "next/cache";

import type {
  ActionState,
  ProductCategory,
  ProductSubCategory,
} from "@/components/product-pool/types";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES_PATH = "/dashboard/categories";
const PRODUCT_POOL_PATH = "/dashboard/product-pool";

const categorySelect =
  "id,user_id,name,parent_id,vat_rate,excise_tax_rate,customs_duty_rate,additional_customs_duty_rate,trt_tax_rate,trendyol_commission_rate,hepsiburada_commission_rate,amazon_commission_rate,gtip_code,notes,created_at,updated_at";

const percentageFields = [
  "vat_rate",
  "excise_tax_rate",
  "customs_duty_rate",
  "additional_customs_duty_rate",
  "trt_tax_rate",
  "trendyol_commission_rate",
  "hepsiburada_commission_rate",
  "amazon_commission_rate",
] as const;

function revalidateCategoryViews() {
  revalidatePath(CATEGORIES_PATH);
  revalidatePath(PRODUCT_POOL_PATH);
}

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

function getNullableNumber(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number(value.replace(",", "."));

  return Number.isFinite(parsed) ? parsed : null;
}

function getNullableId(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value || value === "none") {
    return null;
  }

  return value;
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

function getCategoryPayload(formData: FormData) {
  const name = getString(formData, "name");

  if (!name) {
    throw new Error("Kategori adi zorunludur.");
  }

  return {
    additional_customs_duty_rate: getNullableNumber(
      formData,
      "additional_customs_duty_rate",
    ),
    amazon_commission_rate: getNullableNumber(formData, "amazon_commission_rate"),
    customs_duty_rate: getNullableNumber(formData, "customs_duty_rate"),
    excise_tax_rate: getNullableNumber(formData, "excise_tax_rate"),
    gtip_code: getNullableString(formData, "gtip_code"),
    hepsiburada_commission_rate: getNullableNumber(
      formData,
      "hepsiburada_commission_rate",
    ),
    name,
    notes: getNullableString(formData, "notes"),
    parent_id: getNullableId(formData, "parent_id"),
    trendyol_commission_rate: getNullableNumber(
      formData,
      "trendyol_commission_rate",
    ),
    trt_tax_rate: getNullableNumber(formData, "trt_tax_rate"),
    vat_rate: getNullableNumber(formData, "vat_rate"),
  };
}

async function getValidParentId({
  parentId,
  supabase,
  userId,
}: {
  parentId: string | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
}) {
  if (!parentId) {
    return null;
  }

  const { data, error } = await supabase
    .from("product_categories")
    .select("id,parent_id")
    .eq("id", parentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Ust kategori okunamadi: ${error.message}`);
  }

  if (!data || data.parent_id) {
    throw new Error("Alt kategori icin gecerli bir ana kategori secin.");
  }

  return data.id as string;
}

async function findCategoryByName({
  name,
  parentId,
  supabase,
  userId,
}: {
  name: string;
  parentId: string | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
}) {
  let query = supabase
    .from("product_categories")
    .select(categorySelect)
    .eq("user_id", userId)
    .ilike("name", name);

  query = parentId ? query.eq("parent_id", parentId) : query.is("parent_id", null);

  const { data } = await query.maybeSingle();

  return data as ProductCategory | null;
}

export async function quickCreateCategory(name: string) {
  const normalizedName = name.trim();

  if (!normalizedName) {
    return {
      error: "Kategori adi zorunludur.",
      ok: false,
    };
  }

  const { supabase, user } = await getAuthenticatedClient();
  const existing = await findCategoryByName({
    name: normalizedName,
    parentId: null,
    supabase,
    userId: user.id,
  });

  if (existing) {
    return {
      category: existing,
      ok: true,
    };
  }

  const { data, error } = await supabase
    .from("product_categories")
    .insert({
      name: normalizedName,
      parent_id: null,
      user_id: user.id,
    })
    .select(categorySelect)
    .single();

  if (error) {
    return {
      error: `Kategori eklenemedi: ${error.message}`,
      ok: false,
    };
  }

  revalidateCategoryViews();

  return {
    category: data as ProductCategory,
    ok: true,
  };
}

export async function quickCreateSubCategory(parentId: string, name: string) {
  const normalizedName = name.trim();

  if (!parentId) {
    return {
      error: "Once kategori secin.",
      ok: false,
    };
  }

  if (!normalizedName) {
    return {
      error: "Alt kategori adi zorunludur.",
      ok: false,
    };
  }

  const { supabase, user } = await getAuthenticatedClient();
  const validParentId = await getValidParentId({
    parentId,
    supabase,
    userId: user.id,
  });
  const existing = await findCategoryByName({
    name: normalizedName,
    parentId: validParentId,
    supabase,
    userId: user.id,
  });

  if (existing) {
    return {
      ok: true,
      subCategory: existing as ProductSubCategory,
    };
  }

  const { data, error } = await supabase
    .from("product_categories")
    .insert({
      name: normalizedName,
      parent_id: validParentId,
      user_id: user.id,
    })
    .select(categorySelect)
    .single();

  if (error) {
    return {
      error: `Alt kategori eklenemedi: ${error.message}`,
      ok: false,
    };
  }

  revalidateCategoryViews();

  return {
    ok: true,
    subCategory: data as ProductSubCategory,
  };
}

export async function createCategory(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let payload: ReturnType<typeof getCategoryPayload>;

  try {
    payload = getCategoryPayload(formData);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Kategori eklenemedi.",
      ok: false,
    };
  }

  const { supabase, user } = await getAuthenticatedClient();

  try {
    payload.parent_id = await getValidParentId({
      parentId: payload.parent_id,
      supabase,
      userId: user.id,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Kategori eklenemedi.",
      ok: false,
    };
  }

  const { error } = await supabase.from("product_categories").insert({
    ...payload,
    user_id: user.id,
  });

  if (error) {
    return {
      error: `Kategori eklenemedi: ${error.message}`,
      ok: false,
    };
  }

  revalidateCategoryViews();

  return { ok: true };
}

export async function updateCategory(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = getString(formData, "id");

  if (!id) {
    return {
      error: "Guncellenecek kategori bulunamadi.",
      ok: false,
    };
  }

  let payload: ReturnType<typeof getCategoryPayload>;

  try {
    payload = getCategoryPayload(formData);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Kategori guncellenemedi.",
      ok: false,
    };
  }

  if (payload.parent_id === id) {
    return {
      error: "Kategori kendi ust kategorisi olamaz.",
      ok: false,
    };
  }

  const { supabase, user } = await getAuthenticatedClient();

  try {
    payload.parent_id = await getValidParentId({
      parentId: payload.parent_id,
      supabase,
      userId: user.id,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Kategori guncellenemedi.",
      ok: false,
    };
  }

  const updatePayload = percentageFields.reduce(
    (current, field) => ({
      ...current,
      [field]: payload[field],
    }),
    {
      gtip_code: payload.gtip_code,
      name: payload.name,
      notes: payload.notes,
      parent_id: payload.parent_id,
      updated_at: new Date().toISOString(),
    },
  );

  const { error } = await supabase
    .from("product_categories")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return {
      error: `Kategori guncellenemedi: ${error.message}`,
      ok: false,
    };
  }

  revalidateCategoryViews();

  return { ok: true };
}

export async function deleteCategory(formData: FormData) {
  const id = getString(formData, "id");

  if (!id) {
    throw new Error("Silinecek kategori bulunamadi.");
  }

  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Kategori silinemedi: ${error.message}`);
  }

  revalidateCategoryViews();
}
