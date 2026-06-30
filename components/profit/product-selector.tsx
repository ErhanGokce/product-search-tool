"use client";

import { Check, Store } from "lucide-react";

import {
  marketplaces,
  type Marketplace,
  type ProductPoolItem,
} from "@/components/product-pool/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ProductSelectorProps = {
  onMarketplaceChange: (marketplace: Marketplace) => void;
  onProductChange: (productId: string) => void;
  products: ProductPoolItem[];
  selectedMarketplace: Marketplace;
  selectedProductId: string;
};

export function ProductSelector({
  onMarketplaceChange,
  onProductChange,
  products,
  selectedMarketplace,
  selectedProductId,
}: ProductSelectorProps) {
  const filteredProducts = products.filter(
    (product) => product.marketplace === selectedMarketplace,
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Pazaryeri</p>
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-background p-1.5">
          {marketplaces.map((marketplace) => {
            const isActive = marketplace === selectedMarketplace;
            const count = products.filter(
              (product) => product.marketplace === marketplace,
            ).length;

            return (
              <button
                className={cn(
                  "flex min-h-14 min-w-0 items-center justify-center gap-2 rounded-xl px-2 text-xs font-medium transition-colors sm:text-sm",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                key={marketplace}
                onClick={() => onMarketplaceChange(marketplace)}
                type="button"
              >
                {isActive ? (
                  <Check className="size-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Store className="size-4 shrink-0" aria-hidden="true" />
                )}
                <span className="min-w-0 truncate">{marketplace}</span>
                <span
                  className={cn(
                    "hidden rounded-full px-1.5 py-0.5 text-[10px] sm:inline",
                    isActive
                      ? "bg-black/10 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="space-y-2 text-sm font-medium text-foreground">
        Ürün
        <Select
          disabled={filteredProducts.length === 0}
          onValueChange={onProductChange}
          value={selectedProductId}
        >
          <SelectTrigger className="h-12 rounded-2xl border-border bg-background">
            <SelectValue
              placeholder={
                filteredProducts.length > 0
                  ? "Ürün seç"
                  : "Bu pazaryerinde ürün yok"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {filteredProducts.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.product_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
