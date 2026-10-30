"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatNaira } from "@/lib/utils";
import { ProductPlaceholder } from "@/components/storefront/product-placeholder";

export default function CartPage() {
  const { items, subtotalKobo, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Pieces you add will appear here.</p>
        <Button asChild className="mt-6">
          <Link href="/">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="mb-8 font-serif text-2xl">Your cart</h1>

      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center gap-5 py-6">
            <div className="relative size-20 shrink-0 overflow-hidden border border-border bg-muted">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="80px" />
              ) : (
                <ProductPlaceholder />
              )}
            </div>

            <div className="flex-1">
              <Link href={`/product/${item.slug}`} className="font-serif text-base hover:underline">
                {item.name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{formatNaira(item.unitPriceKobo)}</p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center border border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-none"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-3" />
                  </Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-none"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-xs tracking-wide text-muted-foreground uppercase hover:text-destructive"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="font-serif text-base">
              {formatNaira(item.unitPriceKobo * item.quantity)}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 ml-auto flex max-w-72 flex-col gap-2.5">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatNaira(subtotalKobo)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Shipping</span>
          <span>Calculated at checkout</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3 font-serif text-lg">
          <span>Total</span>
          <span>{formatNaira(subtotalKobo)}</span>
        </div>
      </div>

      <Button asChild size="lg" className="mt-6 w-full">
        <Link href="/checkout">Proceed to checkout</Link>
      </Button>
    </div>
  );
}
