import type { ProductPoolItem } from "@/components/product-pool/types";

function toNumber(value: number | string | null) {
  if (value === null || value === "") {
    return 0;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateOpportunityScore(product: ProductPoolItem) {
  const sellerCount = product.seller_count ?? 0;
  const favoriteCount = product.favorite_count ?? 0;
  const reviewCount = product.review_count ?? 0;
  const discountedPrice = toNumber(product.discounted_price);
  const normalPrice = toNumber(product.normal_price);

  let score = 45;

  if (sellerCount <= 1) {
    score += 24;
  } else if (sellerCount <= 3) {
    score += 18;
  } else if (sellerCount <= 6) {
    score += 10;
  } else if (sellerCount >= 15) {
    score -= 14;
  } else {
    score -= 5;
  }

  score += Math.min(16, Math.log10(favoriteCount + 1) * 5);

  if (reviewCount >= 1000) {
    score -= 14;
  } else if (reviewCount >= 300) {
    score -= 9;
  } else if (reviewCount >= 100) {
    score -= 5;
  }

  if (product.has_big_seller) {
    score -= 18;
  }

  if (product.is_marketplace_seller) {
    score -= 14;
  }

  if (normalPrice > 0 && discountedPrice > 0 && discountedPrice < normalPrice) {
    const discountRate = (normalPrice - discountedPrice) / normalPrice;
    score += Math.min(18, discountRate * 70);
  }

  if (product.is_suitable) {
    score += 12;
  }

  return clampScore(score);
}

export function getOpportunityScoreMeta(score: number) {
  if (score >= 80) {
    return {
      className: "bg-emerald-50 text-emerald-700",
      label: "Cok iyi",
    };
  }

  if (score >= 60) {
    return {
      className: "bg-blue-50 text-blue-700",
      label: "Iyi",
    };
  }

  if (score >= 40) {
    return {
      className: "bg-amber-50 text-amber-700",
      label: "Orta",
    };
  }

  return {
    className: "bg-red-50 text-red-700",
    label: "Zayif",
  };
}
