export const marketplaces = ["Trendyol", "Hepsiburada", "Amazon"] as const;

export type Marketplace = (typeof marketplaces)[number];

export type ProductPoolItem = {
  id: string;
  user_id: string | null;
  product_name: string;
  product_url: string | null;
  marketplace: Marketplace | string;
  category_id: string | null;
  sub_category_id: string | null;
  category: string | null;
  sub_category: string | null;
  discounted_price: number | string | null;
  normal_price: number | string | null;
  purchase_price?: number | string | null;
  purchase_price_includes_vat?: boolean | null;
  purchase_vat_rate?: number | string | null;
  rating_count: number | null;
  review_count: number | null;
  favorite_count: number | null;
  seller_count: number | null;
  is_suitable: boolean | null;
  is_marketplace_seller: boolean | null;
  has_big_seller: boolean | null;
  notes: string | null;
  created_at: string | null;
};

export type ProductCategory = {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  vat_rate: number | string | null;
  excise_tax_rate: number | string | null;
  customs_duty_rate: number | string | null;
  additional_customs_duty_rate: number | string | null;
  trt_tax_rate: number | string | null;
  trendyol_commission_rate: number | string | null;
  hepsiburada_commission_rate: number | string | null;
  amazon_commission_rate: number | string | null;
  gtip_code: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at?: string | null;
};

export type ProductSubCategory = ProductCategory & {
  parent_id: string;
};

export type ActionState = {
  error?: string;
  ok: boolean;
};
