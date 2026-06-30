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
    return "bg-accent/15 text-accent";
  }

  if (status === "Riskli") {
    return "bg-warning-surface text-warning-accent";
  }

  return "bg-red-500/15 text-red-300";
}

export function ProfitScenarioCard({
  result,
  title,
}: ProfitScenarioCardProps) {
  return (
    <Card>
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
          <span className="text-muted-foreground">KDV hariç satış</span>
          <span className="font-medium text-foreground">
            {formatCurrency(result.saleNet)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Vergi öncesi kâr</span>
          <span className="font-medium text-foreground">
            {formatCurrency(result.profitBeforeIncomeTax)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Ödenecek KDV</span>
          <span className="font-medium text-foreground">
            {formatCurrency(result.vatPayable)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Devreden KDV</span>
          <span className="font-medium text-foreground">
            {formatCurrency(result.carriedVat)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Gelir vergisi</span>
          <span className="font-medium text-foreground">
            {formatCurrency(result.estimatedIncomeTax)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Net marj</span>
          <span className="font-medium text-foreground">
            {formatPercent(result.netMargin)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">ROI</span>
          <span className="font-medium text-foreground">
            {formatPercent(result.roi)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Min. satış</span>
          <span className="font-medium text-foreground">
            {formatCurrency(result.minimumSalePrice)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
