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
      />
    </div>
  );
}
