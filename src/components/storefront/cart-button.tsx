"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";

export function CartButton() {
  const { itemCount } = useCart();

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link href="/cart" aria-label="View cart">
        <ShoppingCart className="size-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            {itemCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
