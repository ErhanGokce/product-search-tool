import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  CircleDollarSign,
  Package,
  ShoppingBag,
  Store,
} from "lucide-react";

import {
  calculateOpportunityScore,
  getOpportunityScoreMeta,
} from "@/components/product-pool/opportunity-score";
import type { ProductPoolItem } from "@/components/product-pool/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

function formatNumber(value: number) {
  return value.toLocaleString("tr-TR");
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
    style: "percent",
  }).format(value);
}

function getAverageOpportunityScore(products: ProductPoolItem[]) {
  if (products.length === 0) {
    return 0;
  }

  const total = products.reduce(
    (sum, product) => sum + calculateOpportunityScore(product),
    0,
  );

  return Math.round(total / products.length);
}

function getDiscountAdvantageCount(products: ProductPoolItem[]) {
  return products.filter((product) => {
    const discountedPrice = Number(product.discounted_price ?? 0);
    const normalPrice = Number(product.normal_price ?? 0);

    return normalPrice > 0 && discountedPrice > 0 && discountedPrice < normalPrice;
  }).length;
}

function getHighDemandCount(products: ProductPoolItem[]) {
  return products.filter(
    (product) => (product.favorite_count ?? 0) >= 50 || (product.review_count ?? 0) >= 25,
  ).length;
}

function getLowCompetitionCount(products: ProductPoolItem[]) {
  return products.filter(
    (product) =>
      (product.seller_count ?? 0) <= 3 &&
      !product.has_big_seller &&
      !product.is_marketplace_seller,
  ).length;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("product_pool")
    .select(
      "id,user_id,product_name,product_url,marketplace,category_id,sub_category_id,category,sub_category,discounted_price,normal_price,rating_count,review_count,favorite_count,seller_count,is_suitable,is_marketplace_seller,has_big_seller,notes,created_at",
    )
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Dashboard verileri yuklenemedi: ${error.message}`);
  }

  const products = (data ?? []) as ProductPoolItem[];
  const totalProducts = products.length;
  const suitableProducts = products.filter((product) => product.is_suitable).length;
  const suitableRate = totalProducts > 0 ? suitableProducts / totalProducts : 0;
  const averageOpportunityScore = getAverageOpportunityScore(products);
  const opportunityMeta = getOpportunityScoreMeta(averageOpportunityScore);
  const activeMarketplaces = new Set(
    products.map((product) => product.marketplace).filter(Boolean),
  ).size;

  const kpis = [
    {
      description: "Havuzdaki urun sayisi",
      icon: Package,
      label: "Toplam Urun",
      trend: `${formatNumber(totalProducts)} kayit`,
      value: formatNumber(totalProducts),
    },
    {
      description: "Uygun isaretlenen urunler",
      icon: ShoppingBag,
      label: "Uygun Urunler",
      trend: formatPercent(suitableRate),
      value: formatNumber(suitableProducts),
    },
    {
      description: "Frontend firsat skoru ortalamasi",
      icon: CircleDollarSign,
      label: "Ortalama Firsat Skoru",
      trend: opportunityMeta.label,
      value: String(averageOpportunityScore),
    },
    {
      description: "Urun bulunan pazaryeri sayisi",
      icon: Store,
      label: "Aktif Pazaryeri",
      trend: activeMarketplaces > 0 ? "Aktif" : "Veri yok",
      value: formatNumber(activeMarketplaces),
    },
  ];

  const poolSummary = [
    {
      label: "Fiyat avantajli",
      value: getDiscountAdvantageCount(products),
    },
    {
      label: "Yuksek talep",
      value: getHighDemandCount(products),
    },
    {
      label: "Dusuk rekabet",
      value: getLowCompetitionCount(products),
    },
  ];

  const marketplaceSummary = ["Trendyol", "Hepsiburada", "Amazon"].map(
    (marketplace) => ({
      marketplace,
      value: products.filter((product) => product.marketplace === marketplace).length,
    }),
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <Card className="border-slate-200 bg-white shadow-sm" key={kpi.label}>
              <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-3">
                <div className="space-y-1">
                  <CardDescription>{kpi.label}</CardDescription>
                  <CardTitle className="text-3xl">{kpi.value}</CardTitle>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">{kpi.description}</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                      kpi.label === "Ortalama Firsat Skoru"
                        ? opportunityMeta.className
                        : "bg-emerald-50 text-emerald-700",
                    )}
                  >
                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                    {kpi.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Urun havuzu ozeti</CardTitle>
            <CardDescription>
              Gercek urun havuzu verisine gore performans dagilimi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {poolSummary.map((item) => (
                <div
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  key={item.label}
                >
                  <p className="text-sm font-medium text-slate-950">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {formatNumber(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Pazaryeri durumu</CardTitle>
            <CardDescription>Urun bulunan kaynaklar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {marketplaceSummary.map((item) => (
              <div
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                key={item.marketplace}
              >
                <span className="text-sm font-medium text-slate-700">
                  {item.marketplace}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-xs font-medium",
                    item.value > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {formatNumber(item.value)} urun
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
