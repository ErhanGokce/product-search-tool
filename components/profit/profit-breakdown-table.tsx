"use client";

import type { ProfitCalculationResult } from "@/lib/profit/calculate-profit";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ScenarioBreakdown = {
  result: ProfitCalculationResult;
  title: string;
};

type ProfitBreakdownTableProps = {
  scenarios: ScenarioBreakdown[];
};

type Row = {
  getValue?: (result: ProfitCalculationResult) => string;
  key?: keyof ProfitCalculationResult;
  label: string;
  type?: "currency" | "percent";
};

const rows: Row[] = [
  { key: "grossSalePrice", label: "Brüt satış fiyatı" },
  { key: "saleNet", label: "KDV hariç satış" },
  { key: "outputVat", label: "Satış KDV" },
  { key: "purchaseGross", label: "Alış toplamı" },
  { key: "purchaseNet", label: "Alış net maliyet" },
  { key: "inputVatFromPurchase", label: "Alış/ithalat öncesi indirilecek KDV" },
  { key: "customsBase", label: "Gümrük matrahı" },
  { key: "customsDuty", label: "Gümrük vergisi" },
  { key: "additionalCustomsDuty", label: "İlave gümrük" },
  { key: "exciseTax", label: "ÖTV" },
  { key: "trtTax", label: "TRT vergisi" },
  { key: "importVat", label: "İthalat KDV" },
  { key: "landedCost", label: "Landed cost" },
  { key: "marketplaceCommission", label: "Komisyon net gider" },
  { key: "marketplaceCommissionVat", label: "Komisyon KDV" },
  { key: "marketplaceCommissionTotal", label: "Komisyon toplam kesinti" },
  { key: "marketplaceNetFees", label: "Pazaryeri net giderleri" },
  { key: "shippingCost", label: "Kargo net gideri" },
  { key: "packagingCost", label: "Paketleme net gideri" },
  { key: "operationNetCosts", label: "Operasyon net giderleri" },
  { key: "deductibleVatFromExpenses", label: "Giderlerden indirilecek KDV" },
  { key: "inputVatTotal", label: "Toplam indirilecek KDV" },
  { key: "vatPayable", label: "Ödenecek KDV" },
  { key: "carriedVat", label: "Devreden KDV" },
  { key: "profitBeforeIncomeTax", label: "Gelir vergisi öncesi kâr" },
  { key: "estimatedIncomeTax", label: "Tahmini gelir vergisi etkisi" },
  { key: "netProfit", label: "Net kâr" },
  { key: "netMargin", label: "Net marj %", type: "percent" },
  { key: "roi", label: "ROI %", type: "percent" },
  { key: "minimumSalePrice", label: "Minimum satış fiyatı" },
  {
    getValue: (result) =>
      result.taxCashFlow.length > 0
        ? result.taxCashFlow
            .map((item) => `${item.label}: ${formatCurrency(item.amount)}`)
            .join(" · ")
        : "-",
    label: "Tahmini nakit akışı",
  },
];

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
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

function formatValue(
  value: ProfitCalculationResult[keyof ProfitCalculationResult],
  type?: Row["type"],
) {
  if (typeof value !== "number") {
    return String(value);
  }

  return type === "percent" ? formatPercent(value) : formatCurrency(value);
}

export function ProfitBreakdownTable({ scenarios }: ProfitBreakdownTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kalem</TableHead>
          {scenarios.map((scenario) => (
            <TableHead key={scenario.title}>{scenario.title}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableCell className="min-w-64 font-medium text-foreground">
              {row.label}
            </TableCell>
            {scenarios.map((scenario) => (
              <TableCell className="min-w-56" key={scenario.title}>
                {row.getValue
                  ? row.getValue(scenario.result)
                  : row.key
                    ? formatValue(scenario.result[row.key], row.type)
                    : "-"}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
