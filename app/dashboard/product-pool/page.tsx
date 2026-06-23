import { redirect } from "next/navigation";

import { ProductFormDialog } from "@/components/product-pool/product-form-dialog";
import { ProductCharts } from "@/components/product-pool/product-charts";
import { ProductStats } from "@/components/product-pool/product-stats";
import { ProductTable } from "@/components/product-pool/product-table";
import type {
  ProductCategory,
  ProductPoolItem,
  ProductSubCategory,
} from "@/components/product-pool/types";
import { createClient } from "@/lib/supabase/server";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default async function ProductPoolPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from("product_pool")
      .select(
        "id,user_id,product_name,product_url,marketplace,category_id,sub_category_id,category,sub_category,discounted_price,normal_price,purchase_price,purchase_price_includes_vat,purchase_vat_rate,rating_count,review_count,favorite_count,seller_count,is_suitable,is_marketplace_seller,has_big_seller,notes,created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("product_categories")
      .select(
        "id,user_id,name,parent_id,vat_rate,excise_tax_rate,customs_duty_rate,additional_customs_duty_rate,trt_tax_rate,trendyol_commission_rate,hepsiburada_commission_rate,amazon_commission_rate,gtip_code,notes,created_at,updated_at",
      )
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
  ]);

  if (productsResult.error) {
    throw new Error(`Urun havuzu yuklenemedi: ${productsResult.error.message}`);
  }

  if (categoriesResult.error) {
    throw new Error(`Kategoriler yuklenemedi: ${categoriesResult.error.message}`);
  }

  const products = (productsResult.data ?? []) as ProductPoolItem[];
  const allCategories = (categoriesResult.data ?? []) as ProductCategory[];
  const categories = allCategories.filter((category) => !category.parent_id);
  const subCategories = allCategories.filter(
    (category): category is ProductSubCategory => Boolean(category.parent_id),
  );

  return (
    <div className="app-page">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="app-page-eyebrow">
            Urun arastirma
          </p>
          <h2 className="app-page-title">
            Urun Havuzu
          </h2>
          <p className="app-page-description max-w-2xl">
            Pazaryeri adaylarini fiyat, talep ve rekabet sinyalleriyle birlikte
            takip edin.
          </p>
        </div>
        <ProductFormDialog categories={categories} subCategories={subCategories} />
      </section>
      <Tabs className="min-w-0" defaultValue="table">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="table">Urun tablosu</TabsTrigger>
          <TabsTrigger value="stats">KPI kartlari</TabsTrigger>
          <TabsTrigger value="charts">Grafikler</TabsTrigger>
        </TabsList>
        <TabsContent className="min-w-0" value="table">
          <ProductTable
            categories={categories}
            products={products}
            subCategories={subCategories}
          />
        </TabsContent>
        <TabsContent className="min-w-0" value="stats">
          <ProductStats products={products} />
        </TabsContent>
        <TabsContent className="min-w-0" value="charts">
          <ProductCharts products={products} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
