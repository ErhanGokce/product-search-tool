import { redirect } from "next/navigation";

import { CategoryManager } from "@/components/categories/category-manager";
import type {
  ProductCategory,
  ProductSubCategory,
} from "@/components/product-pool/types";
import { createClient } from "@/lib/supabase/server";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [categoriesResult, subCategoriesResult] = await Promise.all([
    supabase
      .from("product_categories")
      .select("id,user_id,name,created_at,updated_at")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("product_sub_categories")
      .select("id,user_id,category_id,name,created_at,updated_at")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
  ]);

  if (categoriesResult.error) {
    throw new Error(`Kategoriler yuklenemedi: ${categoriesResult.error.message}`);
  }

  if (subCategoriesResult.error) {
    throw new Error(
      `Alt kategoriler yuklenemedi: ${subCategoriesResult.error.message}`,
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-slate-500">Urun siniflandirma</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
          Kategoriler
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Urun havuzunda kullanacaginiz kategori ve alt kategorileri yonetin.
        </p>
      </section>
      <CategoryManager
        categories={(categoriesResult.data ?? []) as ProductCategory[]}
        subCategories={(subCategoriesResult.data ?? []) as ProductSubCategory[]}
      />
    </div>
  );
}
