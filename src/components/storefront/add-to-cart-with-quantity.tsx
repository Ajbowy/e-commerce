"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";

export function AddToCartWithQuantity({
  product,
  disabled,
}: {
  product: {
    productId: string;
    name: string;
    slug: string;
    unitPriceKobo: number;
    imageUrl?: string | null;
  };
  disabled?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center border border-border">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-none"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          aria-label="Decrease quantity"
        >
          <Minus className="size-3.5" />
        </Button>
        <span className="w-8 text-center text-sm">{quantity}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-none"
          onClick={() => setQuantity((q) => q + 1)}
          aria-label="Increase quantity"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <AddToCartButton product={product} quantity={quantity} disabled={disabled} className="flex-1" />
    </div>
  );
}
