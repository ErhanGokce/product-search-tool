import { redirect } from "next/navigation";

import { CategoryManager } from "@/components/categories/category-manager";
import type { ProductCategory } from "@/components/product-pool/types";
import { createClient } from "@/lib/supabase/server";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const categoriesResult = await supabase
    .from("product_categories")
    .select(
      "id,user_id,name,parent_id,vat_rate,excise_tax_rate,customs_duty_rate,additional_customs_duty_rate,trt_tax_rate,trendyol_commission_rate,hepsiburada_commission_rate,amazon_commission_rate,gtip_code,notes,created_at,updated_at",
    )
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (categoriesResult.error) {
    throw new Error(`Kategoriler yuklenemedi: ${categoriesResult.error.message}`);
  }

  return (
    <div className="app-page">
      <section>
        <p className="app-page-eyebrow">Urun siniflandirma</p>
        <h2 className="app-page-title">
          Kategoriler
        </h2>
        <p className="app-page-description max-w-2xl">
          Urun havuzunda kullanacaginiz kategori ve alt kategorileri yonetin.
        </p>
      </section>
      <CategoryManager
        categories={(categoriesResult.data ?? []) as ProductCategory[]}
      />
    </div>
  );
}
