"use client";

import { useMemo, useState } from "react";
import { Archive, Search } from "lucide-react";

import { marketplaces, type Marketplace } from "@/components/product-pool/types";
import { ProfitDetailDialog } from "@/components/profit/profit-detail-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  groupProfitSnapshots,
  toSnapshotNumber,
} from "@/lib/profit/snapshots";
import type { ProfitSnapshot } from "@/lib/profit/types";
import { cn } from "@/lib/utils";

type ProfitHistoryProps = {
  snapshots: ProfitSnapshot[];
  storageAvailable: boolean;
};

const statuses = ["Kârlı", "Riskli", "Zarar"] as const;

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(toSnapshotNumber(value));
}

function formatPercent(value: number | string) {
  return `${new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 1,
  }).format(toSnapshotNumber(value))}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusClassName(status: ProfitSnapshot["status"]) {
  if (status === "Kârlı") {
    return "bg-accent/15 text-accent";
  }

  if (status === "Riskli") {
    return "bg-warning-surface text-warning-accent";
  }

  return "bg-red-500/15 text-red-300";
}

export function ProfitHistory({
  snapshots,
  storageAvailable,
}: ProfitHistoryProps) {
  const [query, setQuery] = useState("");
  const [marketplace, setMarketplace] = useState<Marketplace | "all">("all");
  const [status, setStatus] = useState<ProfitSnapshot["status"] | "all">(
    "all",
  );
  const groups = useMemo(() => groupProfitSnapshots(snapshots), [snapshots]);
  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

    return groups.filter((group) => {
      const matchesQuery =
        !normalizedQuery ||
        group.latest.product_name
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedQuery);
      const matchesMarketplace =
        marketplace === "all" || group.latest.marketplace === marketplace;
      const matchesStatus =
        status === "all" || group.latest.status === status;

      return matchesQuery && matchesMarketplace && matchesStatus;
    });
  }, [groups, marketplace, query, status]);

  if (!storageAvailable) {
    return (
      <Card>
        <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-warning-surface text-warning-accent">
            <Archive className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Snapshot tablosu hazır değil
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Supabase SQL Editor üzerinde
            {" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
              008-create-profit-calculation-snapshots.sql
            </code>
            {" "}
            migration dosyasını çalıştırın. Sayfayı yenilediğinizde analiz
            geçmişi ve kayıt özelliği otomatik açılır.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (snapshots.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Archive className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Kayıtlı analiz yok
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Yeni Hesaplama sekmesinde sonucu kontrol edip Analizi Kaydet
            butonunu kullandığınızda ürünlerin son kârlılık durumu burada
            görünür.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="gap-4 border-b border-border">
        <div>
          <CardTitle>Kayıtlı Ürün Analizleri</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Her ürün ve pazaryeri için son snapshot gösterilir.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_160px]">
          <label className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ürün ara"
              value={query}
            />
          </label>
          <Select
            onValueChange={(value) =>
              setMarketplace(value as Marketplace | "all")
            }
            value={marketplace}
          >
            <SelectTrigger aria-label="Pazaryerine göre filtrele">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm pazaryerleri</SelectItem>
              {marketplaces.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) =>
              setStatus(value as ProfitSnapshot["status"] | "all")
            }
            value={status}
          >
            <SelectTrigger aria-label="Duruma göre filtrele">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm durumlar</SelectItem>
              {statuses.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredGroups.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-60">Ürün</TableHead>
                <TableHead>Pazaryeri</TableHead>
                <TableHead className="text-right">Tahmini satış</TableHead>
                <TableHead className="text-right">Net kâr</TableHead>
                <TableHead className="text-right">Marj</TableHead>
                <TableHead className="text-right">ROI</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="min-w-44">Son hesaplama</TableHead>
                <TableHead>Geçmiş</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => (
                <TableRow key={group.key}>
                  <TableCell>
                    <p
                      className="max-w-64 truncate font-medium text-foreground"
                      title={group.latest.product_name}
                    >
                      {group.latest.product_name}
                    </p>
                  </TableCell>
                  <TableCell>{group.latest.marketplace}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(group.latest.gross_sale_price)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-semibold",
                      toSnapshotNumber(group.latest.net_profit) >= 0
                        ? "text-accent"
                        : "text-red-300",
                    )}
                  >
                    {formatCurrency(group.latest.net_profit)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(group.latest.net_margin)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(group.latest.roi)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                        getStatusClassName(group.latest.status),
                      )}
                    >
                      {group.latest.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(group.latest.created_at)}
                  </TableCell>
                  <TableCell>
                    {group.snapshots.length} snapshot
                  </TableCell>
                  <TableCell className="text-right">
                    <ProfitDetailDialog group={group} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-56 items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Filtrelerle eşleşen kayıt bulunamadı.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
