"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ProfitSnapshot } from "@/lib/profit/types";
import { toSnapshotNumber } from "@/lib/profit/snapshots";

type ProfitSnapshotChartsProps = {
  selectedSnapshot: ProfitSnapshot;
  snapshots: ProfitSnapshot[];
};

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 0,
    notation: "compact",
    style: "currency",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function ProfitSnapshotCharts({
  selectedSnapshot,
  snapshots,
}: ProfitSnapshotChartsProps) {
  const scenarioData = selectedSnapshot.scenarios_snapshot.map((scenario) => ({
    name:
      scenario.key === "normal"
        ? "Normal"
        : scenario.key === "discounted"
          ? "İndirimli"
          : "Tahmini",
    netProfit: scenario.result.netProfit,
    profitBeforeTax: scenario.result.profitBeforeIncomeTax,
  }));
  const estimatedScenario =
    selectedSnapshot.scenarios_snapshot.find(
      (scenario) => scenario.key === "estimated",
    ) ?? selectedSnapshot.scenarios_snapshot[0];
  const companyExpense =
    estimatedScenario?.result.expenseBreakdown
      .filter((expense) => expense.group === "company")
      .reduce((total, expense) => total + expense.profitCost, 0) ?? 0;
  const costData = estimatedScenario
    ? [
        {
          name: "Ürün ve ithalat",
          value: estimatedScenario.result.landedCost,
        },
        {
          name: "Pazaryeri",
          value: estimatedScenario.result.marketplaceNetFees,
        },
        {
          name: "Operasyon",
          value: estimatedScenario.result.operationNetCosts,
        },
        {
          name: "Şirket gideri",
          value: companyExpense,
        },
        {
          name: "Gelir vergisi",
          value: estimatedScenario.result.estimatedIncomeTax,
        },
      ].filter((item) => item.value > 0)
    : [];
  const trendData = [...snapshots]
    .reverse()
    .map((snapshot) => ({
      date: formatDate(snapshot.created_at),
      margin: toSnapshotNumber(snapshot.net_margin),
      profit: toSnapshotNumber(snapshot.net_profit),
    }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">
            Senaryo karşılaştırması
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Vergi öncesi ve vergi sonrası ürün başı kâr
          </p>
        </div>
        <div className="h-60">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={scenarioData} margin={{ left: -12, right: 8 }}>
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="name"
                fontSize={11}
                tick={{ fill: "var(--muted-foreground)" }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                fontSize={10}
                tick={{ fill: "var(--muted-foreground)" }}
                tickFormatter={formatCompactCurrency}
                tickLine={false}
                width={54}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--popover-foreground)",
                }}
                formatter={(value) =>
                  formatCompactCurrency(Number(value ?? 0))
                }
              />
              <Bar
                dataKey="profitBeforeTax"
                fill="var(--chart-3)"
                name="Vergi öncesi"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="netProfit"
                fill="var(--chart-2)"
                name="Net kâr"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">
            Maliyet dağılımı
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Tahmini fiyat senaryosunun ürün başı maliyet yapısı
          </p>
        </div>
        <div className="h-60">
          {costData.length > 0 ? (
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={costData}
                  dataKey="value"
                  innerRadius={52}
                  nameKey="name"
                  outerRadius={82}
                  paddingAngle={3}
                >
                  {costData.map((item, index) => (
                    <Cell
                      fill={chartColors[index % chartColors.length]}
                      key={item.name}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(value) =>
                    formatCompactCurrency(Number(value ?? 0))
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Gösterilecek maliyet bulunmuyor.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 lg:col-span-2">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">
            Kârlılık geçmişi
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Kaydedilen tahmini fiyat snapshot’larının net kâr ve marj trendi
          </p>
        </div>
        <div className="h-64">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={trendData} margin={{ left: -6, right: 12 }}>
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="date"
                fontSize={11}
                tick={{ fill: "var(--muted-foreground)" }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                fontSize={10}
                tick={{ fill: "var(--muted-foreground)" }}
                tickFormatter={formatCompactCurrency}
                tickLine={false}
                width={58}
                yAxisId="profit"
              />
              <YAxis
                axisLine={false}
                fontSize={10}
                orientation="right"
                tick={{ fill: "var(--muted-foreground)" }}
                tickFormatter={(value) => `%${value}`}
                tickLine={false}
                width={42}
                yAxisId="margin"
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--popover-foreground)",
                }}
              />
              <Line
                dataKey="profit"
                dot={{ fill: "var(--chart-2)", r: 3 }}
                name="Net kâr"
                stroke="var(--chart-2)"
                strokeWidth={2}
                type="monotone"
                yAxisId="profit"
              />
              <Line
                dataKey="margin"
                dot={{ fill: "var(--chart-1)", r: 3 }}
                name="Net marj %"
                stroke="var(--chart-1)"
                strokeWidth={2}
                type="monotone"
                yAxisId="margin"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
