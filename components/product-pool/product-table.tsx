"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search, Trash2 } from "lucide-react";

import { deleteProduct } from "@/app/dashboard/product-pool/actions";
import {
  calculateOpportunityScore,
  getOpportunityScoreMeta,
} from "@/components/product-pool/opportunity-score";
import { ProductFormDialog } from "@/components/product-pool/product-form-dialog";
import type {
  ProductCategory,
  ProductPoolItem,
  ProductSubCategory,
} from "@/components/product-pool/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ProductTableProps = {
  categories: ProductCategory[];
  products: ProductPoolItem[];
  subCategories: ProductSubCategory[];
};

const columns = [
  "Urun adi",
  "Pazaryeri",
  "Kategori",
  "Alt kategori",
  "Indirimli fiyat",
  "Normal fiyat",
  "Maliyet TL",
  "Alis KDV",
  "Degerlendirme",
  "Yorum",
  "Favori",
  "Satici",
  "Firsat Skoru",
  "Uygun mu?",
  "Pazaryeri saticisi",
  "Buyuk satici",
  "Notlar",
  "Olusturulma",
  "Islemler",
];

function formatNumber(value: number | null) {
  return (value ?? 0).toLocaleString("tr-TR");
}

function formatPrice(value: ProductPoolItem["discounted_price"]) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numberValue)) {
    return "-";
  }

  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(numberValue);
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function BooleanBadge({
  active,
  label,
}: {
  active: boolean | null;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-1 text-xs font-medium",
        active ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground",
      )}
    >
      {active ? label : "Hayir"}
    </span>
  );
}

function OpportunityBadge({ product }: { product: ProductPoolItem }) {
  const score = calculateOpportunityScore(product);
  const meta = getOpportunityScoreMeta(score);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        meta.className,
      )}
    >
      {score}
      <span className="font-medium">/ {meta.label}</span>
    </span>
  );
}

function ProductNameCell({ name }: { name: string }) {
  return (
    <TooltipProvider delayDuration={80}>
      <Tooltip>
        <TooltipTrigger asChild>
          <p className="max-w-[220px] cursor-default truncate whitespace-nowrap font-medium text-foreground">
            {name}
          </p>
        </TooltipTrigger>
        <TooltipContent align="start" side="top">
          {name}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ProductLinkButton({ url }: { url: string | null }) {
  if (!url) {
    return (
      <Button
        className="h-9 rounded-2xl border-border bg-card px-3 text-muted-foreground shadow-sm"
        disabled
        size="sm"
        type="button"
        variant="outline"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        Urune git
      </Button>
    );
  }

  return (
    <Button
      asChild
      className="h-9 rounded-2xl border-border bg-card px-3 text-foreground shadow-sm hover:bg-muted"
      size="sm"
      variant="outline"
    >
      <a href={url} rel="noreferrer" target="_blank">
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        Urune git
      </a>
    </Button>
  );
}

export function ProductTable({
  categories,
  products,
  subCategories,
}: ProductTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase("tr-TR");

    if (!normalizedQuery) {
      return products;
    }

    return products.filter((product) =>
      product.product_name.toLocaleLowerCase("tr-TR").includes(normalizedQuery),
    );
  }, [products, searchQuery]);

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            0
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-normal text-foreground">
            Urun havuzu bos
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Ilk urunu ekleyerek pazaryeri, fiyat ve rekabet verilerini takip
            etmeye baslayin.
          </p>
          <div className="mt-5">
            <ProductFormDialog
              categories={categories}
              subCategories={subCategories}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-full overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 border-b border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Urun tablosu</h3>
            <p className="text-xs text-muted-foreground">
              {filteredProducts.length} / {products.length} urun gosteriliyor
            </p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="h-10 rounded-2xl border-border bg-surface-elevated pl-9 shadow-none"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Urun adi ara"
              type="search"
              value={searchQuery}
            />
          </div>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Search className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">
              Arama sonucu bulunamadi
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Baska bir urun adi deneyin veya arama alanini temizleyin.
            </p>
          </div>
        ) : (
        <div className="w-full max-w-full overflow-x-auto">
          <table className="w-full min-w-[2040px] text-left text-sm">
            <thead className="border-b border-border bg-surface-elevated text-xs uppercase text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <th className="whitespace-nowrap px-4 py-3 font-medium" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((product) => (
                <tr className="align-top hover:bg-muted/45" key={product.id}>
                  <td className="max-w-[240px] px-4 py-4">
                    <ProductNameCell name={product.product_name} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                    {product.marketplace}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                    {product.category || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                    {product.sub_category || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-medium text-foreground">
                    {formatPrice(product.discounted_price)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                    {formatPrice(product.normal_price)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-medium text-foreground">
                    {formatPrice(product.purchase_price ?? null)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                    %{formatNumber(Number(product.purchase_vat_rate ?? 20))}
                    {product.purchase_price_includes_vat ?? true ? " dahil" : " hariç"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                    {formatNumber(product.rating_count)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                    {formatNumber(product.review_count)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                    {formatNumber(product.favorite_count)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                    {formatNumber(product.seller_count)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <OpportunityBadge product={product} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <BooleanBadge active={product.is_suitable} label="Uygun" />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <BooleanBadge
                      active={product.is_marketplace_seller}
                      label="Evet"
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <BooleanBadge active={product.has_big_seller} label="Var" />
                  </td>
                  <td className="max-w-[280px] px-4 py-4 text-muted-foreground">
                    <p className="line-clamp-2">{product.notes || "-"}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                    {formatDate(product.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="flex items-center gap-2">
                      <ProductLinkButton url={product.product_url} />
                      <ProductFormDialog
                        categories={categories}
                        product={product}
                        subCategories={subCategories}
                      />
                      <form action={deleteProduct}>
                        <input name="id" type="hidden" value={product.id} />
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
