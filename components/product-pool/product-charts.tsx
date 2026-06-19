"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateOpportunityScore } from "@/components/product-pool/opportunity-score";
import type { ProductPoolItem } from "@/components/product-pool/types";

type ProductChartsProps = {
  products: ProductPoolItem[];
};

const chartColors = ["#0f172a", "#2563eb", "#10b981", "#f59e0b", "#ef4444"];

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}

function toChartData(values: Record<string, number>) {
  return Object.entries(values).map(([name, value]) => ({
    name,
    value,
  }));
}

function EmptyChart() {
  return (
    <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
      Grafik icin henuz veri yok.
    </div>
  );
}

function ChartShell({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="gap-1 p-4 pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs leading-5">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2">{children}</CardContent>
    </Card>
  );
}

export function ProductCharts({ products }: ProductChartsProps) {
  const marketplaceData = toChartData(
    countBy(
      ["Trendyol", "Hepsiburada", "Amazon"].map((marketplace) => marketplace),
    ),
  ).map((item) => ({
    ...item,
    value: products.filter((product) => product.marketplace === item.name).length,
  }));

  const categoryData = toChartData(
    countBy(products.map((product) => product.category || "Kategorisiz")),
  ).sort((a, b) => b.value - a.value);

  const suitableData = [
    {
      name: "Uygun",
      value: products.filter((product) => product.is_suitable).length,
    },
    {
      name: "Uygun degil",
      value: products.filter((product) => !product.is_suitable).length,
    },
  ];

  const opportunityData = products
    .map((product) => ({
      name:
        product.product_name.length > 22
          ? `${product.product_name.slice(0, 22)}...`
          : product.product_name,
      score: calculateOpportunityScore(product),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return (
    <section className="grid gap-3 xl:grid-cols-2">
      <ChartShell
        description="Urunlerin pazaryerlerine gore dagilimi."
        title="Pazaryerine gore urun dagilimi"
      >
        {products.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-44">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={marketplaceData} margin={{ bottom: 0, left: -20, right: 4, top: 4 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f172a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartShell>
      <ChartShell
        description="En yogun urun arastirma kategorileri."
        title="Kategoriye gore urun sayisi"
      >
        {categoryData.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-44">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={categoryData.slice(0, 6)} margin={{ bottom: 0, left: -20, right: 4, top: 4 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartShell>
      <ChartShell
        description="Uygun olarak isaretlenen urunlerin orani."
        title="Uygun urun orani"
      >
        {products.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-44">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  data={suitableData}
                  dataKey="value"
                  innerRadius={38}
                  nameKey="name"
                  outerRadius={65}
                  paddingAngle={4}
                >
                  {suitableData.map((entry, index) => (
                    <Cell
                      fill={chartColors[index % chartColors.length]}
                      key={entry.name}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartShell>
      <ChartShell
        description="Dusuk satici, yuksek favori, indirim ve uygunluk sinyalleriyle hesaplanir."
        title="Satici sayisina gore firsat grafigi"
      >
        {opportunityData.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-44">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={opportunityData.slice(0, 6)} layout="vertical" margin={{ bottom: 0, left: 0, right: 4, top: 4 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                <XAxis allowDecimals={false} fontSize={11} tickLine={false} type="number" />
                <YAxis
                  dataKey="name"
                  fontSize={11}
                  tickLine={false}
                  type="category"
                  width={116}
                />
                <Tooltip />
                <Bar dataKey="score" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartShell>
    </section>
  );
}
