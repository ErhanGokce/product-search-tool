import { BadgeCheck, Boxes, Store, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductPoolItem } from "@/components/product-pool/types";

type ProductStatsProps = {
  products: ProductPoolItem[];
};

function formatAverageSellerCount(products: ProductPoolItem[]) {
  if (products.length === 0) {
    return "0";
  }

  const total = products.reduce(
    (sum, product) => sum + (product.seller_count ?? 0),
    0,
  );

  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(total / products.length);
}

export function ProductStats({ products }: ProductStatsProps) {
  const suitableCount = products.filter((product) => product.is_suitable).length;
  const noBigSellerCount = products.filter(
    (product) => product.is_suitable && !product.has_big_seller,
  ).length;

  const stats = [
    {
      icon: Boxes,
      label: "Toplam urun",
      value: products.length.toLocaleString("tr-TR"),
    },
    {
      icon: BadgeCheck,
      label: "Uygun urun sayisi",
      value: suitableCount.toLocaleString("tr-TR"),
    },
    {
      icon: Store,
      label: "Ortalama satici sayisi",
      value: formatAverageSellerCount(products),
    },
    {
      icon: TrendingUp,
      label: "Buyuk satici olmayan firsatlar",
      value: noBigSellerCount.toLocaleString("tr-TR"),
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <Card className="border-slate-200 bg-white shadow-sm" key={stat.label}>
            <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">
                {stat.label}
              </CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-normal text-slate-950">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
