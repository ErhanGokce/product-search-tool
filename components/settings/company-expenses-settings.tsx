"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Trash2, WalletCards } from "lucide-react";

import {
  createCompanyExpense,
  deleteCompanyExpense,
  updateCompanyExpense,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ActionState,
  CompanyExpense,
  ExpensePeriod,
} from "@/components/settings/types";
import { expensePeriods } from "@/components/settings/types";
import { cn } from "@/lib/utils";

type CompanyExpensesSettingsProps = {
  expenses: CompanyExpense[];
};

const initialActionState: ActionState = { ok: false };

const defaultExpenseNames = [
  "Bağ-Kur primi",
  "Aylık muhasebe ücreti",
  "E-fatura / e-arşiv programı",
  "Sanal ofis / kira",
  "Yazılım abonelikleri",
  "Pazaryeri mağaza giderleri",
  "Ek giderler",
];

const periodLabels: Record<ExpensePeriod, string> = {
  monthly: "Aylık",
  one_time: "Tek seferlik",
  quarterly: "Çeyreklik",
  yearly: "Yıllık",
};

function getNumberValue(value: CompanyExpense["amount"]) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function getMonthlyExpenseAmount(expense: CompanyExpense) {
  if (!expense.is_active || expense.period === "one_time") {
    return 0;
  }

  const amount = getNumberValue(expense.amount);

  if (expense.period === "quarterly") {
    return amount / 3;
  }

  if (expense.period === "yearly") {
    return amount / 12;
  }

  return amount;
}

function getPeriodLabel(period: CompanyExpense["period"]) {
  if (expensePeriods.includes(period as ExpensePeriod)) {
    return periodLabels[period as ExpensePeriod];
  }

  return periodLabels.monthly;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function getAmountInputValue(value: CompanyExpense["amount"] | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function InlineError({ state }: { state: ActionState }) {
  if (!state.error) {
    return null;
  }

  return <p className="text-sm text-red-600">{state.error}</p>;
}

function ExpenseFormDialog({ expense }: { expense?: CompanyExpense }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(expense?.name ?? "");
  const [state, setState] = useState<ActionState>(initialActionState);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(expense);
  const action = isEdit ? updateCompanyExpense : createCompanyExpense;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setState(initialActionState);
      setName(expense?.name ?? "");
    }

    if (!nextOpen) {
      setName(expense?.name ?? "");
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
          {isEdit ? "Düzenle" : "Gider ekle"}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl"
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Gideri düzenle" : "Yeni şirket gideri"}
          </DialogTitle>
          <DialogDescription>
            Aylık maliyet hesabına dahil edilecek dönemsel şirket giderini
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
          {expense ? <input name="id" type="hidden" value={expense.id} /> : null}

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Varsayılan gider tipleri
            </p>
            <div className="flex flex-wrap gap-2">
              {defaultExpenseNames.map((expenseName) => (
                <Button
                  className="h-8 rounded-full px-3 text-xs"
                  key={expenseName}
                  onClick={() => {
                    setName(expenseName === "Ek giderler" ? "" : expenseName);
                  }}
                  type="button"
                  variant="outline"
                >
                  {expenseName}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label
              className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2"
              htmlFor={isEdit ? `expense-name-${expense?.id}` : "expense-name"}
            >
              Gider adı
              <Input
                className="h-11 rounded-2xl border-slate-200"
                id={isEdit ? `expense-name-${expense?.id}` : "expense-name"}
                name="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Bağ-Kur primi"
                required
                value={name}
              />
            </label>

            <label
              className="space-y-2 text-sm font-medium text-slate-700"
              htmlFor={isEdit ? `expense-amount-${expense?.id}` : "expense-amount"}
            >
              Tutar
              <Input
                className="h-11 rounded-2xl border-slate-200"
                defaultValue={getAmountInputValue(expense?.amount)}
                id={isEdit ? `expense-amount-${expense?.id}` : "expense-amount"}
                inputMode="decimal"
                min="0"
                name="amount"
                placeholder="0.00"
                step="0.01"
                type="number"
              />
            </label>

            <label
              className="space-y-2 text-sm font-medium text-slate-700"
              htmlFor={isEdit ? `expense-period-${expense?.id}` : "expense-period"}
            >
              Periyot
              <Select
                defaultValue={
                  expensePeriods.includes(expense?.period as ExpensePeriod)
                    ? (expense?.period as ExpensePeriod)
                    : "monthly"
                }
                name="period"
              >
                <SelectTrigger
                  className="h-11 rounded-2xl border-slate-200"
                  id={isEdit ? `expense-period-${expense?.id}` : "expense-period"}
                >
                  <SelectValue placeholder="Periyot seç" />
                </SelectTrigger>
                <SelectContent>
                  {expensePeriods.map((period) => (
                    <SelectItem key={period} value={period}>
                      {periodLabels[period]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label
              className="space-y-2 text-sm font-medium text-slate-700"
              htmlFor={isEdit ? `expense-vat-${expense?.id}` : "expense-vat"}
            >
              KDV oranı %
              <Input
                className="h-11 rounded-2xl border-slate-200"
                defaultValue={getAmountInputValue(expense?.vat_rate ?? 20)}
                id={isEdit ? `expense-vat-${expense?.id}` : "expense-vat"}
                inputMode="decimal"
                min="0"
                name="vat_rate"
                placeholder="20"
                step="0.01"
                type="number"
              />
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:col-span-2">
              <Checkbox
                className="mt-0.5"
                defaultChecked={expense?.is_active ?? true}
                name="is_active"
              />
              <span>
                <span className="block font-medium text-slate-950">Aktif mi?</span>
                <span className="mt-1 block text-slate-500">
                  Pasif giderler toplam aylık ve yıllık hesaplara dahil edilmez.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <Checkbox
                className="mt-0.5"
                defaultChecked={expense?.amount_includes_vat ?? false}
                name="amount_includes_vat"
              />
              <span>
                <span className="block font-medium text-slate-950">
                  Tutar KDV dahil
                </span>
                <span className="mt-1 block text-slate-500">
                  Açıkken gider net tutar ve KDV olarak ayrıştırılır.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <Checkbox
                className="mt-0.5"
                defaultChecked={expense?.vat_deductible ?? false}
                name="vat_deductible"
              />
              <span>
                <span className="block font-medium text-slate-950">
                  KDV indirilebilir
                </span>
                <span className="mt-1 block text-slate-500">
                  Açıkken KDV kâr gideri değil, mahsup tablosu kalemi olur.
                </span>
              </span>
            </label>

            <label
              className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2"
              htmlFor={isEdit ? `expense-notes-${expense?.id}` : "expense-notes"}
            >
              Notlar
              <textarea
                className="min-h-24 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/35 dark:bg-surface-elevated"
                defaultValue={expense?.notes ?? ""}
                id={isEdit ? `expense-notes-${expense?.id}` : "expense-notes"}
                name="notes"
                placeholder="Sözleşme tarihi, ödeme notu veya maliyet detayı"
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
              {isPending ? "Kaydediliyor" : isEdit ? "Kaydet" : "Gider ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExpenseStatusBadge({ isActive }: { isActive: boolean | null }) {
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

function ExpenseRow({ expense }: { expense: CompanyExpense }) {
  const monthlyAmount = getMonthlyExpenseAmount(expense);
  const vatLabel = expense.vat_deductible ? "İndirilebilir" : "Gider";

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-surface-elevated p-4 lg:grid-cols-[1.4fr_0.65fr_0.65fr_0.7fr_0.65fr_0.7fr_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {expense.name}
          </p>
          <ExpenseStatusBadge isActive={expense.is_active} />
        </div>
        {expense.notes ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
            {expense.notes}
          </p>
        ) : (
          <p className="mt-1 text-xs text-slate-400">Not yok</p>
        )}
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-slate-400">Periyot</p>
        <p className="mt-1 text-sm text-slate-700">
          {getPeriodLabel(expense.period)}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-slate-400">Tutar</p>
        <p className="mt-1 text-sm font-medium text-slate-950">
          {formatCurrency(getNumberValue(expense.amount))}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-slate-400">
          Aylık karşılık
        </p>
        <p className="mt-1 text-sm font-medium text-slate-950">
          {formatCurrency(monthlyAmount)}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-slate-400">KDV</p>
        <p className="mt-1 text-sm text-slate-700">
          %{getNumberValue(expense.vat_rate ?? 0)} · {vatLabel}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-slate-400">
          Hesaplama
        </p>
        <p className="mt-1 text-sm text-slate-700">
          {expense.is_active && expense.period !== "one_time"
            ? "Dahil"
            : "Hariç"}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
        <ExpenseFormDialog expense={expense} />
        <form action={deleteCompanyExpense}>
          <input name="id" type="hidden" value={expense.id} />
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

export function CompanyExpensesSettings({
  expenses,
}: CompanyExpensesSettingsProps) {
  const summary = useMemo(() => {
    const monthlyTotal = expenses.reduce(
      (total, expense) => total + getMonthlyExpenseAmount(expense),
      0,
    );
    const oneTimeTotal = expenses.reduce((total, expense) => {
      if (!expense.is_active || expense.period !== "one_time") {
        return total;
      }

      return total + getNumberValue(expense.amount);
    }, 0);
    const activeExpenseCount = expenses.filter((expense) => expense.is_active).length;

    return {
      activeExpenseCount,
      monthlyTotal,
      oneTimeTotal,
      yearlyTotal: monthlyTotal * 12,
    };
  }, [expenses]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-3">
            <div>
              <CardDescription>Toplam aylık gider</CardDescription>
              <CardTitle className="mt-1 text-3xl">
                {formatCurrency(summary.monthlyTotal)}
              </CardTitle>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <WalletCards className="h-5 w-5" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              {summary.activeExpenseCount} aktif gider hesaplamaya dahil.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Yıllıklaştırılmış gider</CardDescription>
            <CardTitle className="mt-1 text-3xl">
              {formatCurrency(summary.yearlyTotal)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Aktif dönemsel giderlerin aylık karşılığı 12 ile çarpılır.
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader className="pb-3">
            <CardDescription>Tek seferlik giderler</CardDescription>
            <CardTitle className="mt-1 text-3xl">
              {formatCurrency(summary.oneTimeTotal)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Aylık ve yıllık toplamlara dahil edilmez.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Şirket Giderleri</CardTitle>
            <CardDescription>
              Aylık veya dönemsel şirket giderlerini yönetin. Pasif ve tek
              seferlik giderler kâr hesabına dahil edilmez.
            </CardDescription>
          </div>
          <ExpenseFormDialog />
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Henüz şirket gideri yok. Başlamak için bir gider ekleyin.
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <ExpenseRow expense={expense} key={expense.id} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
