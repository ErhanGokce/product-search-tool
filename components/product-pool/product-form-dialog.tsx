"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";

import {
  createProduct,
  updateProduct,
} from "@/app/dashboard/product-pool/actions";
import {
  quickCreateCategory,
  quickCreateSubCategory,
} from "@/app/dashboard/categories/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  marketplaces,
  type ActionState,
  type Marketplace,
  type ProductCategory,
  type ProductPoolItem,
  type ProductSubCategory,
} from "@/components/product-pool/types";
import { cn } from "@/lib/utils";

type ProductFormDialogProps = {
  categories: ProductCategory[];
  product?: ProductPoolItem;
  subCategories: ProductSubCategory[];
};

const initialActionState: ActionState = { ok: false };

const booleanFields = [
  {
    description: "Bu urun hedef kriterlere uygun.",
    label: "Uygun mu?",
    name: "is_suitable",
  },
  {
    description: "Ana satici pazaryerinin kendisi.",
    label: "Saticisi pazaryeri mi?",
    name: "is_marketplace_seller",
  },
  {
    description: "Rekabette buyuk satici bulunuyor.",
    label: "Buyuk satici var mi?",
    name: "has_big_seller",
  },
] as const;

function getPriceValue(value: ProductPoolItem["discounted_price"] | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function getInitialCategoryId(
  product: ProductPoolItem | undefined,
  categories: ProductCategory[],
) {
  if (product?.category_id) {
    return product.category_id;
  }

  return (
    categories.find((category) => category.name === product?.category)?.id ?? ""
  );
}

function getInitialSubCategoryId(
  product: ProductPoolItem | undefined,
  subCategories: ProductSubCategory[],
) {
  if (product?.sub_category_id) {
    return product.sub_category_id;
  }

  return (
    subCategories.find((subCategory) => subCategory.name === product?.sub_category)
      ?.id ?? ""
  );
}

export function ProductFormDialog({
  categories,
  product,
  subCategories,
}: ProductFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const [subCategoryOptions, setSubCategoryOptions] = useState(subCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState(() =>
    getInitialCategoryId(product, categories),
  );
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(() =>
    getInitialSubCategoryId(product, subCategories),
  );
  const [quickCategoryName, setQuickCategoryName] = useState("");
  const [quickSubCategoryName, setQuickSubCategoryName] = useState("");
  const [quickError, setQuickError] = useState<string | null>(null);
  const [isQuickPending, startQuickTransition] = useTransition();
  const isEdit = Boolean(product);
  const action = isEdit ? updateProduct : createProduct;
  const [state, formAction] = useActionState(action, initialActionState);
  const marketplace = marketplaces.includes(product?.marketplace as Marketplace)
    ? (product?.marketplace as Marketplace)
    : "Trendyol";

  const filteredSubCategories = useMemo(
    () =>
      subCategoryOptions.filter(
        (subCategory) => subCategory.parent_id === selectedCategoryId,
      ),
    [selectedCategoryId, subCategoryOptions],
  );

  useEffect(() => {
    if (submitted && state.ok) {
      const timeoutId = window.setTimeout(() => {
        setSubmitted(false);
        setOpen(false);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [state.ok, submitted]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setSubmitted(false);
      setQuickError(null);
      setQuickCategoryName("");
      setQuickSubCategoryName("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "rounded-2xl",
            isEdit && "h-9 border-slate-200 bg-white px-3 text-slate-700 shadow-sm",
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
          {isEdit ? "Duzenle" : "Urun ekle"}
        </Button>
      </DialogTrigger>
      <DialogContent
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Urunu duzenle" : "Yeni urun ekle"}</DialogTitle>
          <DialogDescription>
            Urun arastirma havuzu icin pazar, fiyat ve rekabet verilerini girin.
          </DialogDescription>
        </DialogHeader>
        <form
          action={formAction}
          className="space-y-5"
          onSubmit={() => {
            setSubmitted(true);
          }}
        >
          {product ? <input name="id" type="hidden" value={product.id} /> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="product_name">
                Urun adi
              </label>
              <Input
                defaultValue={product?.product_name ?? ""}
                id="product_name"
                name="product_name"
                placeholder="Kablosuz kulaklik, robot supurge..."
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="product_url">
                Urun linki
              </label>
              <Input
                defaultValue={product?.product_url ?? ""}
                id="product_url"
                name="product_url"
                placeholder="https://..."
                type="url"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="marketplace">
                Pazaryeri
              </label>
              <Select defaultValue={marketplace} name="marketplace">
                <SelectTrigger id="marketplace">
                  <SelectValue placeholder="Pazaryeri secin" />
                </SelectTrigger>
                <SelectContent>
                  {marketplaces.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="category_id">
                Kategori
              </label>
              <Select
                name="category_id"
                onValueChange={(value) => {
                  const nextCategoryId = value === "none" ? "" : value;
                  setSelectedCategoryId(nextCategoryId);
                  setSelectedSubCategoryId("");
                }}
                value={selectedCategoryId || "none"}
              >
                <SelectTrigger id="category_id">
                  <SelectValue placeholder="Kategori secin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kategori yok</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="sub_category_id">
                Alt kategori
              </label>
              <Select
                disabled={!selectedCategoryId || filteredSubCategories.length === 0}
                name="sub_category_id"
                onValueChange={(value) => {
                  setSelectedSubCategoryId(value === "none" ? "" : value);
                }}
                value={selectedSubCategoryId || "none"}
              >
                <SelectTrigger id="sub_category_id">
                  <SelectValue placeholder="Alt kategori secin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Alt kategori yok</SelectItem>
                  {filteredSubCategories.map((subCategory) => (
                    <SelectItem key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="discounted_price">
                Indirimli fiyat
              </label>
              <Input
                defaultValue={getPriceValue(product?.discounted_price)}
                id="discounted_price"
                min="0"
                name="discounted_price"
                step="0.01"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="normal_price">
                Normal fiyat
              </label>
              <Input
                defaultValue={getPriceValue(product?.normal_price)}
                id="normal_price"
                min="0"
                name="normal_price"
                step="0.01"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="rating_count">
                Degerlendirme sayisi
              </label>
              <Input
                defaultValue={product?.rating_count ?? 0}
                id="rating_count"
                min="0"
                name="rating_count"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="review_count">
                Yorum sayisi
              </label>
              <Input
                defaultValue={product?.review_count ?? 0}
                id="review_count"
                min="0"
                name="review_count"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="favorite_count">
                Favori sayisi
              </label>
              <Input
                defaultValue={product?.favorite_count ?? 0}
                id="favorite_count"
                min="0"
                name="favorite_count"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="seller_count">
                Satici sayisi
              </label>
              <Input
                defaultValue={product?.seller_count ?? 0}
                id="seller_count"
                min="0"
                name="seller_count"
                type="number"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="notes">
                Notlar
              </label>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-input bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue={product?.notes ?? ""}
                id="notes"
                name="notes"
                placeholder="Tedarik, rekabet veya fiyat notlari"
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {booleanFields.map((field) => (
              <label
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                key={field.name}
              >
                <Checkbox
                  defaultChecked={Boolean(product?.[field.name])}
                  name={field.name}
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-slate-800">
                    {field.label}
                  </span>
                  <span className="block text-xs leading-5 text-slate-500">
                    {field.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {state.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button className="rounded-2xl" type="submit">
              {isEdit ? "Guncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">
              Hizli kategori ekle
            </p>
            <div className="flex gap-2">
              <Input
                className="bg-white"
                onChange={(event) => setQuickCategoryName(event.target.value)}
                placeholder="Kategori adi"
                value={quickCategoryName}
              />
              <Button
                disabled={isQuickPending}
                onClick={() => {
                  startQuickTransition(() => {
                    void quickCreateCategory(quickCategoryName).then((result) => {
                      if (!result.ok || !result.category) {
                        setQuickError(result.error ?? "Kategori eklenemedi.");
                        return;
                      }

                      setCategoryOptions((current) => {
                        if (current.some((item) => item.id === result.category.id)) {
                          return current;
                        }

                        return [...current, result.category].sort((a, b) =>
                          a.name.localeCompare(b.name, "tr"),
                        );
                      });
                      setSelectedCategoryId(result.category.id);
                      setSelectedSubCategoryId("");
                      setQuickCategoryName("");
                      setQuickError(null);
                    });
                  });
                }}
                type="button"
                variant="outline"
              >
                Ekle
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">
              Hizli alt kategori ekle
            </p>
            <div className="flex gap-2">
              <Input
                className="bg-white"
                disabled={!selectedCategoryId}
                onChange={(event) => setQuickSubCategoryName(event.target.value)}
                placeholder="Alt kategori adi"
                value={quickSubCategoryName}
              />
              <Button
                disabled={isQuickPending || !selectedCategoryId}
                onClick={() => {
                  startQuickTransition(() => {
                    void quickCreateSubCategory(
                      selectedCategoryId,
                      quickSubCategoryName,
                    ).then((result) => {
                      if (!result.ok || !result.subCategory) {
                        setQuickError(result.error ?? "Alt kategori eklenemedi.");
                        return;
                      }

                      setSubCategoryOptions((current) => {
                        if (
                          current.some((item) => item.id === result.subCategory.id)
                        ) {
                          return current;
                        }

                        return [...current, result.subCategory].sort((a, b) =>
                          a.name.localeCompare(b.name, "tr"),
                        );
                      });
                      setSelectedSubCategoryId(result.subCategory.id);
                      setQuickSubCategoryName("");
                      setQuickError(null);
                    });
                  });
                }}
                type="button"
                variant="outline"
              >
                Ekle
              </Button>
            </div>
          </div>
          {quickError ? (
            <p className="text-sm text-red-600 md:col-span-2">{quickError}</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
