"use client";

import type {
  ProfitCalculationResult,
  ProfitStatus,
} from "@/lib/profit/calculate-profit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProfitScenarioCardProps = {
  result: ProfitCalculationResult;
  title: string;
};

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return `${new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function getStatusClassName(status: ProfitStatus) {
  if (status === "Kârlı") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "Riskli") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-red-50 text-red-700";
}

export function ProfitScenarioCard({
  result,
  title,
}: ProfitScenarioCardProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>{title}</CardDescription>
            <CardTitle className="mt-1 text-2xl">
              {formatCurrency(result.netProfit)}
            </CardTitle>
          </div>
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
              getStatusClassName(result.status),
            )}
          >
            {result.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Brüt satış</span>
          <span className="font-medium text-slate-950">
            {formatCurrency(result.grossSalePrice)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Net marj</span>
          <span className="font-medium text-slate-950">
            {formatPercent(result.netMargin)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">ROI</span>
          <span className="font-medium text-slate-950">
            {formatPercent(result.roi)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Min. satış</span>
          <span className="font-medium text-slate-950">
            {formatCurrency(result.minimumSalePrice)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
