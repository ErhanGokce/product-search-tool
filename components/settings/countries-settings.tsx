"use client";

import { useState, useTransition } from "react";
import { FileCheck2, Pencil, Plus, Trash2 } from "lucide-react";

import {
  createCountry,
  deleteCountry,
  updateCountry,
} from "@/app/dashboard/settings/actions";
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
import type {
  ActionState,
  CountrySetting,
} from "@/components/settings/types";
import { cn } from "@/lib/utils";

type CountriesSettingsProps = {
  countries: CountrySetting[];
};

const initialActionState: ActionState = { ok: false };

function InlineError({ state }: { state: ActionState }) {
  if (!state.error) {
    return null;
  }

  return <p className="text-sm text-red-600">{state.error}</p>;
}

function AtrBadge({ hasAtr }: { hasAtr: boolean | null }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium",
        hasAtr
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700",
      )}
    >
      {hasAtr ? "ATR var" : "ATR yok"}
    </span>
  );
}

function CountryFormDialog({ country }: { country?: CountrySetting }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ActionState>(initialActionState);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(country);
  const action = isEdit ? updateCountry : createCountry;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setState(initialActionState);
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
          {isEdit ? "Düzenle" : "Ülke ekle"}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl"
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ülkeyi düzenle" : "Yeni ülke ekle"}</DialogTitle>
          <DialogDescription>
            İthalat maliyeti ve ATR kontrolünde kullanılacak ülke bilgisini
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
          {country ? <input name="id" type="hidden" value={country.id} /> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label
              className="space-y-2 text-sm font-medium text-slate-700"
              htmlFor={isEdit ? `country-name-${country?.id}` : "country-name"}
            >
              Ülke adı
              <Input
                className="h-11 rounded-2xl border-slate-200"
                defaultValue={country?.name ?? ""}
                id={isEdit ? `country-name-${country?.id}` : "country-name"}
                name="name"
                placeholder="Almanya"
                required
              />
            </label>

            <label
              className="space-y-2 text-sm font-medium text-slate-700"
              htmlFor={isEdit ? `country-code-${country?.id}` : "country-code"}
            >
              Ülke kodu
              <Input
                className="h-11 rounded-2xl border-slate-200 uppercase"
                defaultValue={country?.code ?? ""}
                id={isEdit ? `country-code-${country?.id}` : "country-code"}
                maxLength={8}
                name="code"
                placeholder="DE"
              />
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:col-span-2">
              <Checkbox
                className="mt-0.5"
                defaultChecked={country?.has_atr ?? false}
                name="has_atr"
              />
              <span>
                <span className="block font-medium text-slate-950">
                  ATR var mı?
                </span>
                <span className="mt-1 block text-slate-500">
                  Bu ülke için ATR belgesiyle gümrük vergisi avantajı
                  değerlendirilir.
                </span>
              </span>
            </label>

            <label
              className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2"
              htmlFor={isEdit ? `country-notes-${country?.id}` : "country-notes"}
            >
              Notlar
              <textarea
                className="min-h-24 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/35 dark:bg-surface-elevated"
                defaultValue={country?.notes ?? ""}
                id={isEdit ? `country-notes-${country?.id}` : "country-notes"}
                name="notes"
                placeholder="GTIP, belge veya tedarik notları"
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
              {isPending ? "Kaydediliyor" : isEdit ? "Kaydet" : "Ülke ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CountryRow({ country }: { country: CountrySetting }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-surface-elevated p-4 lg:grid-cols-[1.2fr_0.45fr_0.65fr_1fr_auto] lg:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {country.name}
        </p>
        {country.notes ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {country.notes}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Not yok</p>
        )}
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground">Kod</p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {country.code || "-"}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground">ATR</p>
        <div className="mt-1">
          <AtrBadge hasAtr={country.has_atr} />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground">Kontrol</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {country.has_atr ? "GTIP bazında doğrula" : "Standart vergi kontrolü"}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
        <CountryFormDialog country={country} />
        <form action={deleteCountry}>
          <input name="id" type="hidden" value={country.id} />
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

export function CountriesSettings({ countries }: CountriesSettingsProps) {
  const atrCountryCount = countries.filter((country) => country.has_atr).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <FileCheck2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle>İthalat ülkeleri ve ATR</CardTitle>
            <CardDescription>
              Türkiye yerli alış için ayrıca eklenmez. Bu liste yalnızca
              ithalat yapılan ülkeler ve ATR kontrolü için kullanılır.
            </CardDescription>
          </div>
          {countries.length > 0 ? <CountryFormDialog /> : null}
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-warning-border bg-warning-surface p-4 text-sm leading-6 text-warning-foreground">
            Kâr hesabında ithalat kapalıysa kaynak yerli alış / Türkiye kabul
            edilir. ATR var diye tüm vergiler sıfırlanmaz; KDV, ÖTV, TRT
            bandrolü veya ilave mali yükümlülükler ayrıca hesaplanabilir.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Ülkeler</CardTitle>
            <CardDescription>
              {countries.length} ülke kayıtlı, {atrCountryCount} ülke ATR
              avantajı için işaretli.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {countries.length === 0 ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>
                Henüz ithalat ülkesi yok. Türkiye’yi değil, ithalat yaptığınız
                ülkeleri ekleyin.
              </p>
              <CountryFormDialog />
            </div>
          ) : (
            <div className="space-y-3">
              {countries.map((country) => (
                <CountryRow country={country} key={country.id} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
