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

const chartColors = ["#d9ff8f", "#34f5b5", "#9ca39a", "#5d6659", "#f7f8f4"];
const gridColor = "rgba(255,255,255,0.08)";
const tickColor = "#9ca39a";
const tooltipStyle = {
  background: "#171914",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "14px",
  color: "#f7f8f4",
};

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
    <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-border bg-surface-elevated text-sm text-muted-foreground">
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
    <Card>
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
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} stroke={tickColor} tickLine={false} />
                <YAxis allowDecimals={false} fontSize={11} stroke={tickColor} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="value" fill="#d9ff8f" radius={[8, 8, 0, 0]} />
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
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} stroke={tickColor} tickLine={false} />
                <YAxis allowDecimals={false} fontSize={11} stroke={tickColor} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="value" fill="#34f5b5" radius={[8, 8, 0, 0]} />
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
                <Tooltip contentStyle={tooltipStyle} />
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
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
                <XAxis allowDecimals={false} fontSize={11} stroke={tickColor} tickLine={false} type="number" />
                <YAxis
                  dataKey="name"
                  fontSize={11}
                  stroke={tickColor}
                  tickLine={false}
                  type="category"
                  width={116}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="score" fill="#34f5b5" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartShell>
    </section>
  );
}
