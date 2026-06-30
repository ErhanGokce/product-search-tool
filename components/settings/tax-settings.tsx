"use client";

import { useMemo, useState, useTransition } from "react";
import { Landmark, Pencil, Plus, ReceiptText, Trash2 } from "lucide-react";

import {
  createTaxSetting,
  deleteTaxSetting,
  updateTaxSetting,
} from "@/app/dashboard/settings/actions";
import type {
  ActionState,
  TaxPeriod,
  TaxSetting,
  TaxType,
} from "@/components/settings/types";
import { taxPeriods, taxTypes } from "@/components/settings/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type TaxSettingsProps = {
  taxSettings: TaxSetting[];
};

const initialActionState: ActionState = { ok: false };

const defaultTaxNames = [
  "Gelir vergisi",
  "Geçici vergi",
  "KDV beyannamesi damga vergisi",
  "Muhtasar damga vergisi",
  "Yıllık gelir vergisi beyannamesi damga vergisi",
  "Stopaj / kira stopajı",
  "Diğer",
];

const taxTypeLabels: Record<TaxType, string> = {
  corporate_tax: "Kurumlar vergisi",
  income_tax: "Gelir vergisi",
  other: "Diğer",
  provisional_tax: "Geçici vergi",
  stamp_tax: "Damga vergisi",
  withholding_tax: "Stopaj",
};

const periodLabels: Record<TaxPeriod, string> = {
  monthly: "Aylık",
  per_declaration: "Beyanname başına",
  quarterly: "Çeyreklik",
  yearly: "Yıllık",
};

function getNumberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getInputValue(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

export function getMonthlyTaxFixedCost(tax: TaxSetting) {
  if (!tax.is_active || tax.period === "per_declaration") {
    return 0;
  }

  const fixedAmount = getNumberValue(tax.fixed_amount);

  if (tax.period === "quarterly") {
    return fixedAmount / 3;
  }

  if (tax.period === "yearly") {
    return fixedAmount / 12;
  }

  return fixedAmount;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function formatRate(value: TaxSetting["rate"]) {
  const numericValue = getNumberValue(value);

  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function getTaxTypeLabel(taxType: TaxSetting["tax_type"]) {
  if (taxTypes.includes(taxType as TaxType)) {
    return taxTypeLabels[taxType as TaxType];
  }

  return taxTypeLabels.other;
}

function getPeriodLabel(period: TaxSetting["period"]) {
  if (taxPeriods.includes(period as TaxPeriod)) {
    return periodLabels[period as TaxPeriod];
  }

  return periodLabels.monthly;
}

function InlineError({ state }: { state: ActionState }) {
  if (!state.error) {
    return null;
  }

  return <p className="text-sm text-red-600">{state.error}</p>;
}

function TaxStatusBadge({ isActive }: { isActive: boolean | null }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium",
        isActive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500",
      )}
    >
      {isActive ? "Aktif" : "Pasif"}
    </span>
  );
}

function TaxFormDialog({ tax }: { tax?: TaxSetting }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(tax?.name ?? "");
  const [state, setState] = useState<ActionState>(initialActionState);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(tax);
  const action = isEdit ? updateTaxSetting : createTaxSetting;
  const selectedTaxType = taxTypes.includes(tax?.tax_type as TaxType)
    ? (tax?.tax_type as TaxType)
    : "other";
  const selectedPeriod = taxPeriods.includes(tax?.period as TaxPeriod)
    ? (tax?.period as TaxPeriod)
    : "monthly";

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setState(initialActionState);
      setName(tax?.name ?? "");
    }

    if (!nextOpen) {
      setName(tax?.name ?? "");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "rounded-2xl",
            isEdit && "h-9 border-border bg-card px-3 text-foreground shadow-sm",
          )}
          size={isEdit ? "sm" : "default"}
          type="button"
          variant={isEdit ? "outline" : "default"}
        >
          {isEdit ? (
            <Pencil className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Plus className="h-4 w-4" aria-hidden="true" />
          )}
          {isEdit ? "Düzenle" : "Vergi ekle"}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-3xl"
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Vergi ayarını düzenle" : "Yeni vergi ayarı"}
          </DialogTitle>
          <DialogDescription>
            Dönemsel vergi oranlarını ve sabit beyanname maliyetlerini
            tanımlayın.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();

            const formData = new FormData(event.currentTarget);

            startTransition(async () => {
              const result = await action(initialActionState, formData);

              setState(result);

              if (result.ok) {
                setOpen(false);
              }
            });
          }}
        >
          {tax ? <input name="id" type="hidden" value={tax.id} /> : null}

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Varsayılan vergi örnekleri
            </p>
            <div className="flex flex-wrap gap-2">
              {defaultTaxNames.map((taxName) => (
                <Button
                  className="h-8 rounded-full px-3 text-xs"
                  key={taxName}
                  onClick={() => {
                    setName(taxName === "Diğer" ? "" : taxName);
                  }}
                  type="button"
                  variant="outline"
                >
                  {taxName}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label
              className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2"
              htmlFor={isEdit ? `tax-name-${tax?.id}` : "tax-name"}
            >
              Vergi adı
              <Input
                className="h-11 rounded-2xl border-slate-200"
                id={isEdit ? `tax-name-${tax?.id}` : "tax-name"}
                name="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Gelir vergisi"
                required
                value={name}
              />
            </label>

            <label
              className="space-y-2 text-sm font-medium text-slate-700"
              htmlFor={isEdit ? `tax-type-${tax?.id}` : "tax-type"}
            >
              Vergi tipi
              <Select defaultValue={selectedTaxType} name="tax_type">
                <SelectTrigger
                  className="h-11 rounded-2xl border-slate-200"
                  id={isEdit ? `tax-type-${tax?.id}` : "tax-type"}
                >
                  <SelectValue placeholder="Vergi tipi seç" />
                </SelectTrigger>
                <SelectContent>
                  {taxTypes.map((taxType) => (
                    <SelectItem key={taxType} value={taxType}>
                      {taxTypeLabels[taxType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label
              className="space-y-2 text-sm font-medium text-slate-700"
              htmlFor={isEdit ? `tax-period-${tax?.id}` : "tax-period"}
            >
              Periyot
              <Select defaultValue={selectedPeriod} name="period">
                <SelectTrigger
                  className="h-11 rounded-2xl border-slate-200"
                  id={isEdit ? `tax-period-${tax?.id}` : "tax-period"}
                >
                  <SelectValue placeholder="Periyot seç" />
                </SelectTrigger>
                <SelectContent>
                  {taxPeriods.map((period) => (
                    <SelectItem key={period} value={period}>
                      {periodLabels[period]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label
              className="space-y-2 text-sm font-medium text-slate-700"
              htmlFor={isEdit ? `tax-rate-${tax?.id}` : "tax-rate"}
            >
              Oran %
              <div className="relative">
                <Input
                  className="h-11 rounded-2xl border-slate-200 pr-10"
                  defaultValue={getInputValue(tax?.rate)}
                  id={isEdit ? `tax-rate-${tax?.id}` : "tax-rate"}
                  inputMode="decimal"
                  min="0"
                  name="rate"
                  placeholder="0"
                  step="0.01"
                  type="number"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  %
                </span>
              </div>
            </label>

            <label
              className="space-y-2 text-sm font-medium text-slate-700"
              htmlFor={isEdit ? `tax-fixed-${tax?.id}` : "tax-fixed"}
            >
              Sabit tutar
              <Input
                className="h-11 rounded-2xl border-slate-200"
                defaultValue={getInputValue(tax?.fixed_amount)}
                id={isEdit ? `tax-fixed-${tax?.id}` : "tax-fixed"}
                inputMode="decimal"
                min="0"
                name="fixed_amount"
                placeholder="0.00"
                step="0.01"
                type="number"
              />
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:col-span-2">
              <Checkbox
                className="mt-0.5"
                defaultChecked={tax?.is_active ?? true}
                name="is_active"
              />
              <span>
                <span className="block font-medium text-slate-950">Aktif mi?</span>
                <span className="mt-1 block text-slate-500">
                  Pasif vergi ayarları aylıklaştırılmış maliyete dahil edilmez.
                </span>
              </span>
            </label>

            <label
              className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2"
              htmlFor={isEdit ? `tax-notes-${tax?.id}` : "tax-notes"}
            >
              Notlar
              <textarea
                className="min-h-24 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/35 dark:bg-surface-elevated"
                defaultValue={tax?.notes ?? ""}
                id={isEdit ? `tax-notes-${tax?.id}` : "tax-notes"}
                name="notes"
                placeholder="Beyanname, dönem veya hesaplama notları"
              />
            </label>
          </div>

          <InlineError state={state} />

          <DialogFooter>
            <Button
              className="rounded-2xl"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Kaydediliyor" : isEdit ? "Kaydet" : "Vergi ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TaxRow({ tax }: { tax: TaxSetting }) {
  const monthlyCost = getMonthlyTaxFixedCost(tax);

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-surface-elevated p-4 xl:grid-cols-[1.1fr_0.85fr_0.55fr_0.75fr_0.85fr_0.65fr_auto] xl:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {tax.name}
          </p>
          <TaxStatusBadge isActive={tax.is_active} />
        </div>
        {tax.notes ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
            {tax.notes}
          </p>
        ) : (
          <p className="mt-1 text-xs text-slate-400">Not yok</p>
        )}
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-slate-400">Tip</p>
        <p className="mt-1 text-sm text-slate-700">
          {getTaxTypeLabel(tax.tax_type)}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-slate-400">Oran</p>
        <p className="mt-1 text-sm font-medium text-slate-950">
          %{formatRate(tax.rate)}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-slate-400">
          Sabit tutar
        </p>
        <p className="mt-1 text-sm font-medium text-slate-950">
          {formatCurrency(getNumberValue(tax.fixed_amount))}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-slate-400">
          Aylıklaştırılmış
        </p>
        <p className="mt-1 text-sm font-medium text-slate-950">
          {formatCurrency(monthlyCost)}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-slate-400">Periyot</p>
        <p className="mt-1 text-sm text-slate-700">
          {getPeriodLabel(tax.period)}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
        <TaxFormDialog tax={tax} />
        <form action={deleteTaxSetting}>
          <input name="id" type="hidden" value={tax.id} />
          <Button
            className="h-9 w-full rounded-2xl border-red-500/25 bg-red-500/10 px-3 text-red-300 shadow-sm hover:bg-red-500/15 sm:w-auto"
            type="submit"
            variant="outline"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Sil
          </Button>
        </form>
      </div>
    </div>
  );
}

export function TaxSettings({ taxSettings }: TaxSettingsProps) {
  const summary = useMemo(() => {
    const monthlyFixedTotal = taxSettings.reduce(
      (total, tax) => total + getMonthlyTaxFixedCost(tax),
      0,
    );
    const declarationTotal = taxSettings.reduce((total, tax) => {
      if (!tax.is_active || tax.period !== "per_declaration") {
        return total;
      }

      return total + getNumberValue(tax.fixed_amount);
    }, 0);
    const activeTaxCount = taxSettings.filter((tax) => tax.is_active).length;

    return {
      activeTaxCount,
      declarationTotal,
      monthlyFixedTotal,
      yearlyFixedTotal: monthlyFixedTotal * 12,
    };
  }, [taxSettings]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Landmark className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle>Gelir vergisi notu</CardTitle>
            <CardDescription>
              Gelir vergisi ürün bazında direkt satış fiyatından düşülmez.
              Dönemsel net kâr üzerinden tahmini hesaplanmalı; ürün kâr
              hesaplamasında ayrıca “tahmini gelir vergisi etkisi” olarak
              gösterilir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-warning-border bg-warning-surface p-4 text-sm leading-6 text-warning-foreground">
              Gelir vergisi kademeli yapıda olabilir. Bu ekran yalnızca oran ve
              dönemsel varsayımları saklar; gerçek vergi etkisi dönem net kârı
              üzerinden ayrıca hesaplanmalıdır.
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-3">
              <div>
                <CardDescription>Aylık sabit vergi maliyeti</CardDescription>
                <CardTitle className="mt-1 text-3xl">
                  {formatCurrency(summary.monthlyFixedTotal)}
                </CardTitle>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <ReceiptText className="h-5 w-5" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                {summary.activeTaxCount} aktif vergi ayarı dikkate alınıyor.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Yıllıklaştırılmış sabit maliyet</CardDescription>
              <CardTitle className="mt-1 text-3xl">
                {formatCurrency(summary.yearlyFixedTotal)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Beyanname başına sabit tutarlar hariç tutulur. Beyanname toplamı:
                {" "}
                {formatCurrency(summary.declarationTotal)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Vergiler</CardTitle>
            <CardDescription>
              Şirketin dönemsel ve genel vergi ayarlarını yönetin. Sabit
              damga vergileri periyoda göre aylıklaştırılmış maliyet olarak
              izlenebilir.
            </CardDescription>
          </div>
          <TaxFormDialog />
        </CardHeader>
        <CardContent>
          {taxSettings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Henüz vergi ayarı yok. Başlamak için bir vergi ayarı ekleyin.
            </div>
          ) : (
            <div className="space-y-3">
              {taxSettings.map((tax) => (
                <TaxRow key={tax.id} tax={tax} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
