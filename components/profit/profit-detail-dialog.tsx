"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";

import { ProfitBreakdownTable } from "@/components/profit/profit-breakdown-table";
import { ProfitSnapshotCharts } from "@/components/profit/profit-snapshot-charts";
import { ProfitWarnings } from "@/components/profit/profit-warnings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProfitSnapshotGroup } from "@/lib/profit/snapshots";
import { toSnapshotNumber } from "@/lib/profit/snapshots";

type ProfitDetailDialogProps = {
  group: ProfitSnapshotGroup;
};

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(toSnapshotNumber(value));
}

function formatPercent(value: number | string) {
  return `${new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
  }).format(toSnapshotNumber(value))}%`;
}

function formatDate(value: string, includeTime = true) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: includeTime ? "short" : undefined,
  }).format(new Date(value));
}

export function ProfitDetailDialog({ group }: ProfitDetailDialogProps) {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(
    group.latest.id,
  );
  const selectedSnapshot =
    group.snapshots.find(
      (snapshot) => snapshot.id === selectedSnapshotId,
    ) ?? group.latest;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <BarChart3 className="size-4" aria-hidden="true" />
          Detay
        </Button>
      </DialogTrigger>
      <DialogContent className="block w-[calc(100%-1rem)] max-w-[1400px] p-0">
        <DialogHeader className="border-b border-border px-5 py-5 pr-14 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-primary">
                {selectedSnapshot.marketplace}
              </p>
              <DialogTitle className="mt-1 truncate text-xl">
                {selectedSnapshot.product_name}
              </DialogTitle>
              <DialogDescription>
                {formatDate(selectedSnapshot.created_at)} tarihli analiz ·{" "}
                {group.snapshots.length} kayıt
              </DialogDescription>
            </div>
            <div className="w-full shrink-0 lg:w-72">
              <Select
                onValueChange={setSelectedSnapshotId}
                value={selectedSnapshot.id}
              >
                <SelectTrigger aria-label="Snapshot seç">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {group.snapshots.map((snapshot, index) => (
                    <SelectItem key={snapshot.id} value={snapshot.id}>
                      {index === 0 ? "Son hesaplama · " : ""}
                      {formatDate(snapshot.created_at)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Tahmini satış",
                value: formatCurrency(selectedSnapshot.gross_sale_price),
              },
              {
                label: "Net kâr",
                value: formatCurrency(selectedSnapshot.net_profit),
              },
              {
                label: "Net marj",
                value: formatPercent(selectedSnapshot.net_margin),
              },
              {
                label: "ROI",
                value: formatPercent(selectedSnapshot.roi),
              },
            ].map((item) => (
              <div
                className="rounded-2xl border border-border bg-card p-4"
                key={item.label}
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <ProfitSnapshotCharts
            selectedSnapshot={selectedSnapshot}
            snapshots={group.snapshots}
          />

          <ProfitWarnings warnings={selectedSnapshot.warnings ?? []} />

          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-foreground">
                Tam maliyet kırılımı
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Snapshot kaydedildiği andaki üç fiyat senaryosu.
              </p>
            </div>
            <ProfitBreakdownTable
              scenarios={selectedSnapshot.scenarios_snapshot}
            />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
