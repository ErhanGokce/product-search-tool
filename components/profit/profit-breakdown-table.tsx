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

const rows: Array<{
  key: keyof ProfitCalculationResult;
  label: string;
  type?: "currency" | "percent";
}> = [
  { key: "grossSalePrice", label: "Brüt satış fiyatı" },
  { key: "saleWithoutVat", label: "KDV hariç satış" },
  { key: "productCost", label: "Ürün maliyeti" },
  { key: "customsDuty", label: "Gümrük vergisi" },
  { key: "additionalCustomsDuty", label: "İlave gümrük" },
  { key: "exciseTax", label: "ÖTV" },
  { key: "trtTax", label: "TRT vergisi" },
  { key: "marketplaceCommission", label: "Pazaryeri komisyonu" },
  { key: "shippingCost", label: "Kargo gideri" },
  { key: "operatingCostPerProduct", label: "Ürün başı şirket gider payı" },
  { key: "estimatedIncomeTax", label: "Tahmini gelir vergisi etkisi" },
  { key: "netProfit", label: "Net kâr" },
  { key: "netMargin", label: "Net marj %", type: "percent" },
  { key: "roi", label: "ROI %", type: "percent" },
  { key: "minimumSalePrice", label: "Minimum satış fiyatı" },
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

function formatValue(value: ProfitCalculationResult[keyof ProfitCalculationResult], type?: string) {
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
          <TableRow key={row.key}>
            <TableCell className="min-w-56 font-medium text-slate-950">
              {row.label}
            </TableCell>
            {scenarios.map((scenario) => (
              <TableCell className="min-w-44" key={scenario.title}>
                {formatValue(scenario.result[row.key], row.type)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
