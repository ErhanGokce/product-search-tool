"use server";

import { revalidatePath } from "next/cache";

import {
  marketplaces,
  type ActionState,
  type Marketplace,
} from "@/components/product-pool/types";
import { createClient } from "@/lib/supabase/server";

const PRODUCT_POOL_PATH = "/dashboard/product-pool";

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

function getNullableUrl(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

function getNullableNumber(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number(value.replace(",", "."));

  return Number.isFinite(parsed) ? parsed : null;
}

function getInteger(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function normalizeOptionalId(value: string) {
  if (!value || value === "none") {
    return null;
  }

  return value;
}

function getMarketplace(formData: FormData): Marketplace {
  const marketplace = getString(formData, "marketplace");

  if (marketplaces.includes(marketplace as Marketplace)) {
    return marketplace as Marketplace;
  }

  return "Trendyol";
}

async function getCategoryNames({
  categoryId,
  supabase,
  subCategoryId,
  userId,
}: {
  categoryId: string | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
  subCategoryId: string | null;
  userId: string;
}) {
  const categoryResult = categoryId
    ? await supabase
        .from("product_categories")
        .select("id,name")
        .eq("id", categoryId)
        .eq("user_id", userId)
        .maybeSingle()
    : { data: null, error: null };

  if (categoryResult.error) {
    throw new Error(`Kategori okunamadi: ${categoryResult.error.message}`);
  }

  const category = categoryResult.data as { id: string; name: string } | null;
  const subCategoryResult =
    subCategoryId && category
      ? await supabase
          .from("product_categories")
          .select("id,name")
          .eq("id", subCategoryId)
          .eq("parent_id", category.id)
          .eq("user_id", userId)
          .maybeSingle()
      : { data: null, error: null };

  if (subCategoryResult.error) {
    throw new Error(`Alt kategori okunamadi: ${subCategoryResult.error.message}`);
  }

  const subCategory = subCategoryResult.data as { id: string; name: string } | null;

  return {
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? null,
    subCategoryId: subCategory?.id ?? null,
    subCategoryName: subCategory?.name ?? null,
  };
}

async function getProductPayload(
  formData: FormData,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const productName = getString(formData, "product_name");

  if (!productName) {
    throw new Error("Urun adi zorunludur.");
  }

  const categoryId = normalizeOptionalId(getString(formData, "category_id"));
  const subCategoryId = normalizeOptionalId(getString(formData, "sub_category_id"));
  const names = await getCategoryNames({
    categoryId,
    supabase,
    subCategoryId,
    userId,
  });

  return {
    product_name: productName,
    product_url: getNullableUrl(formData, "product_url"),
    marketplace: getMarketplace(formData),
    category: names.categoryName,
    category_id: names.categoryId,
    discounted_price: getNullableNumber(formData, "discounted_price"),
    is_suitable: getBoolean(formData, "is_suitable"),
    is_marketplace_seller: getBoolean(formData, "is_marketplace_seller"),
    has_big_seller: getBoolean(formData, "has_big_seller"),
    favorite_count: getInteger(formData, "favorite_count"),
    normal_price: getNullableNumber(formData, "normal_price"),
    notes: getNullableString(formData, "notes"),
    purchase_price: getNullableNumber(formData, "purchase_price"),
    purchase_price_includes_vat: getBoolean(
      formData,
      "purchase_price_includes_vat",
    ),
    purchase_vat_rate: getNullableNumber(formData, "purchase_vat_rate") ?? 20,
    rating_count: getInteger(formData, "rating_count"),
    review_count: getInteger(formData, "review_count"),
    seller_count: getInteger(formData, "seller_count"),
    sub_category: names.subCategoryName,
    sub_category_id: names.subCategoryId,
  };
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

export async function createProduct(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await getAuthenticatedClient();
  const payload = await getProductPayload(formData, supabase, user.id);

  const { error } = await supabase.from("product_pool").insert({
    ...payload,
    user_id: user.id,
  });

  if (error) {
    return {
      error: `Urun eklenemedi: ${error.message}`,
      ok: false,
    };
  }

  revalidatePath(PRODUCT_POOL_PATH);

  return { ok: true };
}

export async function updateProduct(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = getString(formData, "id");

  if (!id) {
    return {
      error: "Guncellenecek urun bulunamadi.",
      ok: false,
    };
  }

  const { supabase, user } = await getAuthenticatedClient();
  const payload = await getProductPayload(formData, supabase, user.id);

  const { error } = await supabase
    .from("product_pool")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return {
      error: `Urun guncellenemedi: ${error.message}`,
      ok: false,
    };
  }

  revalidatePath(PRODUCT_POOL_PATH);

  return { ok: true };
}

export async function deleteProduct(formData: FormData) {
  const id = getString(formData, "id");

  if (!id) {
    throw new Error("Silinecek urun bulunamadi.");
  }

  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("product_pool")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Urun silinemedi: ${error.message}`);
  }

  revalidatePath(PRODUCT_POOL_PATH);
}
