"use client";

import { createContext, useEffect, useReducer, useState } from "react";
import { CART_STORAGE_KEY, cartReducer, type CartAction, type CartItem } from "@/lib/cart";

export const CartContext = createContext<{
  items: CartItem[];
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  // Tracked as state (not a ref) so the persist effect below re-runs on the
  // render where hydration lands, instead of racing ahead and writing an
  // empty cart to localStorage before the hydrated items are applied.
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        dispatch({ type: "hydrate", items: JSON.parse(raw) });
      }
    } catch {
      // ignore corrupt/unavailable localStorage
    }
    // One-time mount hydration from localStorage, not a cascading-render
    // pattern - the write-effect below intentionally depends on this flag.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  return <CartContext.Provider value={{ items, dispatch }}>{children}</CartContext.Provider>;
}
