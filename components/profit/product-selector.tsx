"use client";

import type { ProductPoolItem } from "@/components/product-pool/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProductSelectorProps = {
  onProductChange: (productId: string) => void;
  products: ProductPoolItem[];
  selectedProductId: string;
};

export function ProductSelector({
  onProductChange,
  products,
  selectedProductId,
}: ProductSelectorProps) {
  return (
    <Select onValueChange={onProductChange} value={selectedProductId}>
      <SelectTrigger className="h-11 rounded-2xl border-border bg-background dark:bg-surface-elevated">
        <SelectValue placeholder="Ürün seç" />
      </SelectTrigger>
      <SelectContent>
        {products.map((product) => (
          <SelectItem key={product.id} value={product.id}>
            {product.product_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
