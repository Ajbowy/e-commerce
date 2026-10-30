"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  product: {
    productId: string;
    name: string;
    slug: string;
    unitPriceKobo: number;
    imageUrl?: string | null;
  };
  quantity?: number;
  disabled?: boolean;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
}

export function AddToCartButton({
  product,
  quantity = 1,
  disabled,
  className,
  variant,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <Button
      type="button"
      variant={variant}
      disabled={disabled}
      className={cn(className)}
      onClick={() => {
        addItem(product, quantity);
        toast.success(`Added ${product.name} to cart`);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
    >
      {disabled ? "Out of stock" : added ? "Added" : "Add to cart"}
    </Button>
  );
}
