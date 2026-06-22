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

  const [productsResult, categoriesResult, subCategoriesResult] = await Promise.all([
    supabase
      .from("product_pool")
      .select(
        "id,user_id,product_name,product_url,marketplace,category_id,sub_category_id,category,sub_category,discounted_price,normal_price,rating_count,review_count,favorite_count,seller_count,is_suitable,is_marketplace_seller,has_big_seller,notes,created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
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

  if (productsResult.error) {
    throw new Error(`Urun havuzu yuklenemedi: ${productsResult.error.message}`);
  }

  if (categoriesResult.error) {
    throw new Error(`Kategoriler yuklenemedi: ${categoriesResult.error.message}`);
  }

  if (subCategoriesResult.error) {
    throw new Error(
      `Alt kategoriler yuklenemedi: ${subCategoriesResult.error.message}`,
    );
  }

  const products = (productsResult.data ?? []) as ProductPoolItem[];
  const categories = (categoriesResult.data ?? []) as ProductCategory[];
  const subCategories = (subCategoriesResult.data ?? []) as ProductSubCategory[];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Urun arastirma
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
            Urun Havuzu
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Pazaryeri adaylarini fiyat, talep ve rekabet sinyalleriyle birlikte
            takip edin.
          </p>
        </div>
        <ProductFormDialog categories={categories} subCategories={subCategories} />
      </section>
      <Tabs defaultValue="table">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="table">Urun tablosu</TabsTrigger>
          <TabsTrigger value="stats">KPI kartlari</TabsTrigger>
          <TabsTrigger value="charts">Grafikler</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <ProductTable
            categories={categories}
            products={products}
            subCategories={subCategories}
          />
        </TabsContent>
        <TabsContent value="stats">
          <ProductStats products={products} />
        </TabsContent>
        <TabsContent value="charts">
          <ProductCharts products={products} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
