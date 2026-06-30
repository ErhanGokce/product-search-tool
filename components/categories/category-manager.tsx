"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/dashboard/categories/actions";
import type { ActionState, ProductCategory } from "@/components/product-pool/types";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type CategoryManagerProps = {
  categories: ProductCategory[];
};

type RateField = {
  key:
    | "vat_rate"
    | "excise_tax_rate"
    | "customs_duty_rate"
    | "additional_customs_duty_rate"
    | "trt_tax_rate"
    | "trendyol_commission_rate"
    | "hepsiburada_commission_rate"
    | "amazon_commission_rate";
  label: string;
  shortLabel: string;
};

const initialState: ActionState = { ok: false };

const rateFields: RateField[] = [
  {
    key: "vat_rate",
    label: "KDV %",
    shortLabel: "KDV",
  },
  {
    key: "excise_tax_rate",
    label: "ÖTV %",
    shortLabel: "ÖTV",
  },
  {
    key: "customs_duty_rate",
    label: "Gümrük %",
    shortLabel: "Gümrük",
  },
  {
    key: "additional_customs_duty_rate",
    label: "İlave Gümrük %",
    shortLabel: "İlave Gümrük",
  },
  {
    key: "trt_tax_rate",
    label: "TRT %",
    shortLabel: "TRT",
  },
  {
    key: "trendyol_commission_rate",
    label: "Trendyol %",
    shortLabel: "Trendyol",
  },
  {
    key: "hepsiburada_commission_rate",
    label: "Hepsiburada %",
    shortLabel: "Hepsiburada",
  },
  {
    key: "amazon_commission_rate",
    label: "Amazon %",
    shortLabel: "Amazon",
  },
];

function getRateInputValue(
  value: ProductCategory[RateField["key"]] | undefined,
) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function formatRateValue(value: ProductCategory[RateField["key"]]) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "-";
  }

  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function InlineError({ state }: { state: ActionState }) {
  if (!state.error) {
    return null;
  }

  return <p className="text-sm text-red-600">{state.error}</p>;
}

export function getEffectiveCategoryRates(
  category: ProductCategory,
  parent: ProductCategory | null,
) {
  return rateFields.reduce(
    (values, field) => ({
      ...values,
      [field.key]: category[field.key] ?? parent?.[field.key] ?? null,
    }),
    {} as Record<RateField["key"], ProductCategory[RateField["key"]]>,
  );
}

function RateCell({
  category,
  field,
  parent,
}: {
  category: ProductCategory;
  field: RateField;
  parent: ProductCategory | null;
}) {
  const ownValue = category[field.key];
  const inheritedValue = parent?.[field.key] ?? null;
  const isInherited =
    ownValue === null || ownValue === undefined || ownValue === "";
  const value = isInherited ? inheritedValue : ownValue;

  return (
    <div className="min-w-20">
      <span className="font-medium text-foreground">
        {formatRateValue(value)}
      </span>
      {isInherited && value !== null && value !== undefined && value !== "" ? (
        <span className="ml-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          miras
        </span>
      ) : null}
    </div>
  );
}

function CategoryFormDialog({
  category,
  rootCategories,
}: {
  category?: ProductCategory;
  rootCategories: ProductCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ActionState>(initialState);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(category);
  const action = isEdit ? updateCategory : createCategory;
  const parentOptions = rootCategories.filter((item) => item.id !== category?.id);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setState(initialState);
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
          {isEdit ? "Düzenle" : "Kategori ekle"}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-5xl"
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Kategoriyi düzenle" : "Yeni kategori ekle"}
          </DialogTitle>
          <DialogDescription>
            Vergi, GTIP ve pazaryeri komisyon oranlarını kategori veya alt
            kategori bazında tanımlayın.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();

            const formData = new FormData(event.currentTarget);

            startTransition(async () => {
              const result = await action(initialState, formData);

              setState(result);

              if (result.ok) {
                setOpen(false);
              }
            });
          }}
        >
          {category ? <input name="id" type="hidden" value={category.id} /> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label
              className="space-y-2 text-sm font-medium text-slate-700"
              htmlFor={isEdit ? `category-name-${category?.id}` : "category-name"}
            >
              Kategori adı
              <Input
                className="h-11 rounded-2xl border-slate-200"
                defaultValue={category?.name ?? ""}
                id={isEdit ? `category-name-${category?.id}` : "category-name"}
                name="name"
                placeholder="Elektronik"
                required
              />
            </label>

            <label
              className="space-y-2 text-sm font-medium text-slate-700"
              htmlFor={isEdit ? `category-parent-${category?.id}` : "category-parent"}
            >
              Üst kategori
              <Select defaultValue={category?.parent_id ?? "none"} name="parent_id">
                <SelectTrigger
                  className="h-11 rounded-2xl border-slate-200"
                  id={isEdit ? `category-parent-${category?.id}` : "category-parent"}
                >
                  <SelectValue placeholder="Ana kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ana kategori</SelectItem>
                  {parentOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {rateFields.map((field) => (
              <label
                className="space-y-2 text-sm font-medium text-slate-700"
                htmlFor={
                  isEdit
                    ? `${field.key}-${category?.id}`
                    : `new-${field.key}`
                }
                key={field.key}
              >
                {field.label}
                <Input
                  className="h-11 rounded-2xl border-slate-200"
                  defaultValue={getRateInputValue(category?.[field.key])}
                  id={
                    isEdit
                      ? `${field.key}-${category?.id}`
                      : `new-${field.key}`
                  }
                  inputMode="decimal"
                  name={field.key}
                  placeholder="0"
                  step="0.01"
                  type="number"
                />
              </label>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label
              className="space-y-2 text-sm font-medium text-slate-700"
              htmlFor={isEdit ? `gtip-${category?.id}` : "gtip"}
            >
              GTIP kodu
              <Input
                className="h-11 rounded-2xl border-slate-200"
                defaultValue={category?.gtip_code ?? ""}
                id={isEdit ? `gtip-${category?.id}` : "gtip"}
                name="gtip_code"
                placeholder="8517.13.00.00.11"
              />
            </label>

            <label
              className="space-y-2 text-sm font-medium text-slate-700"
              htmlFor={isEdit ? `notes-${category?.id}` : "notes"}
            >
              Notlar
              <textarea
                className="min-h-24 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/35 dark:bg-surface-elevated"
                defaultValue={category?.notes ?? ""}
                id={isEdit ? `notes-${category?.id}` : "notes"}
                name="notes"
                placeholder="Kategoriye özel vergi veya komisyon notları"
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
              {isPending ? "Kaydediliyor" : isEdit ? "Kaydet" : "Kategori ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryRows({
  categories,
  rootCategories,
}: {
  categories: ProductCategory[];
  rootCategories: ProductCategory[];
}) {
  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  if (categories.length === 0) {
    return (
      <TableRow>
        <TableCell className="py-8 text-center text-muted-foreground" colSpan={12}>
          Henüz kategori yok. Vergi ve komisyon oranlarını tanımlamak için
          kategori ekleyin.
        </TableCell>
      </TableRow>
    );
  }

  return categories.map((category) => {
    const parent = category.parent_id
      ? categoriesById.get(category.parent_id) ?? null
      : null;
    const gtip = category.gtip_code ?? parent?.gtip_code ?? "-";

    return (
      <TableRow key={category.id}>
        <TableCell className="min-w-44 font-medium text-foreground">
          {parent?.name ?? category.name}
        </TableCell>
        <TableCell className="min-w-44 text-muted-foreground">
          {parent ? category.name : "-"}
        </TableCell>
        {rateFields.map((field) => (
          <TableCell className="min-w-28" key={field.key}>
            <RateCell category={category} field={field} parent={parent} />
          </TableCell>
        ))}
        <TableCell className="min-w-36 text-muted-foreground">{gtip}</TableCell>
        <TableCell className="min-w-40">
          <div className="flex gap-2">
            <CategoryFormDialog
              category={category}
              rootCategories={rootCategories}
            />
            <form action={deleteCategory}>
              <input name="id" type="hidden" value={category.id} />
              <Button
                className="h-9 rounded-2xl border-red-500/25 bg-red-500/10 px-3 text-red-300 shadow-sm hover:bg-red-500/15"
                size="sm"
                type="submit"
                variant="outline"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Sil
              </Button>
            </form>
          </div>
        </TableCell>
      </TableRow>
    );
  });
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const rootCategories = useMemo(
    () => categories.filter((category) => !category.parent_id),
    [categories],
  );

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle>Kategori Vergi ve Komisyon Ayarları</CardTitle>
          <CardDescription>
            Ana kategori ve alt kategori bazında vergi, GTIP ve pazaryeri
            komisyon oranlarını yönetin. Alt kategoride boş bırakılan oranlar
            ana kategoriden miras alınır.
          </CardDescription>
        </div>
        <CategoryFormDialog rootCategories={rootCategories} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori</TableHead>
              <TableHead>Alt kategori</TableHead>
              {rateFields.map((field) => (
                <TableHead key={field.key}>{field.shortLabel} %</TableHead>
              ))}
              <TableHead>GTIP</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <CategoryRows
              categories={categories}
              rootCategories={rootCategories}
            />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
