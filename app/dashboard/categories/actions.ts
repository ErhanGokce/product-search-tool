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

async function findCategoryByName(userId: string, name: string) {
  const { supabase } = await getAuthenticatedClient();
  const { data } = await supabase
    .from("product_categories")
    .select("id,user_id,name,created_at,updated_at")
    .eq("user_id", userId)
    .ilike("name", name)
    .maybeSingle();

  return data as ProductCategory | null;
}

async function findSubCategoryByName(
  userId: string,
  categoryId: string,
  name: string,
) {
  const { supabase } = await getAuthenticatedClient();
  const { data } = await supabase
    .from("product_sub_categories")
    .select("id,user_id,category_id,name,created_at,updated_at")
    .eq("user_id", userId)
    .eq("category_id", categoryId)
    .ilike("name", name)
    .maybeSingle();

  return data as ProductSubCategory | null;
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

  const existing = await findCategoryByName(user.id, normalizedName);

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
      user_id: user.id,
    })
    .select("id,user_id,name,created_at,updated_at")
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

export async function quickCreateSubCategory(categoryId: string, name: string) {
  const normalizedName = name.trim();

  if (!categoryId) {
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
  const existing = await findSubCategoryByName(
    user.id,
    categoryId,
    normalizedName,
  );

  if (existing) {
    return {
      ok: true,
      subCategory: existing,
    };
  }

  const { data, error } = await supabase
    .from("product_sub_categories")
    .insert({
      category_id: categoryId,
      name: normalizedName,
      user_id: user.id,
    })
    .select("id,user_id,category_id,name,created_at,updated_at")
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
  const result = await quickCreateCategory(getString(formData, "name"));

  return {
    error: result.error,
    ok: result.ok,
  };
}

export async function updateCategory(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = getString(formData, "id");
  const name = getString(formData, "name");

  if (!id || !name) {
    return {
      error: "Kategori bilgisi eksik.",
      ok: false,
    };
  }

  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("product_categories")
    .update({
      name,
      updated_at: new Date().toISOString(),
    })
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

export async function createSubCategory(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await quickCreateSubCategory(
    getString(formData, "category_id"),
    getString(formData, "name"),
  );

  return {
    error: result.error,
    ok: result.ok,
  };
}

export async function updateSubCategory(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = getString(formData, "id");
  const categoryId = getString(formData, "category_id");
  const name = getString(formData, "name");

  if (!id || !categoryId || !name) {
    return {
      error: "Alt kategori bilgisi eksik.",
      ok: false,
    };
  }

  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("product_sub_categories")
    .update({
      category_id: categoryId,
      name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return {
      error: `Alt kategori guncellenemedi: ${error.message}`,
      ok: false,
    };
  }

  revalidateCategoryViews();

  return { ok: true };
}

export async function deleteSubCategory(formData: FormData) {
  const id = getString(formData, "id");

  if (!id) {
    throw new Error("Silinecek alt kategori bulunamadi.");
  }

  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("product_sub_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Alt kategori silinemedi: ${error.message}`);
  }

  revalidateCategoryViews();
}
