export const marketplaces = ["Trendyol", "Hepsiburada", "Amazon"] as const;

export type Marketplace = (typeof marketplaces)[number];

export type ProductPoolItem = {
  id: string;
  user_id: string | null;
  product_name: string;
  marketplace: Marketplace | string;
  category_id: string | null;
  sub_category_id: string | null;
  category: string | null;
  sub_category: string | null;
  discounted_price: number | string | null;
  normal_price: number | string | null;
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
  created_at: string | null;
  updated_at?: string | null;
};

export type ProductSubCategory = {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  created_at: string | null;
  updated_at?: string | null;
};

export type ActionState = {
  error?: string;
  ok: boolean;
};
