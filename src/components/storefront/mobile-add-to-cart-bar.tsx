"use client";

import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { formatNaira } from "@/lib/utils";

export function MobileAddToCartBar({
  product,
  priceKobo,
  disabled,
}: {
  product: {
    productId: string;
    name: string;
    slug: string;
    unitPriceKobo: number;
    imageUrl?: string | null;
  };
  priceKobo: number;
  disabled?: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t bg-background px-4 py-3 md:hidden">
      <span className="font-serif text-lg">{formatNaira(priceKobo)}</span>
      <AddToCartButton product={product} disabled={disabled} className="flex-1 max-w-48" />
    </div>
  );
}
