"use client";

import { useContext, useMemo } from "react";
import { CartContext } from "@/components/cart-provider";
import { cartSubtotalKobo, type CartItem } from "@/lib/cart";

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  const { items, dispatch } = ctx;

  const subtotalKobo = useMemo(() => cartSubtotalKobo(items), [items]);
  const itemCount = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);

  return {
    items,
    subtotalKobo,
    itemCount,
    addItem: (item: Omit<CartItem, "quantity">, quantity = 1) =>
      dispatch({ type: "add", item, quantity }),
    removeItem: (productId: string) => dispatch({ type: "remove", productId }),
    updateQuantity: (productId: string, quantity: number) =>
      dispatch({ type: "updateQuantity", productId, quantity }),
    clear: () => dispatch({ type: "clear" }),
  };
}
