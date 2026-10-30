"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/hooks/use-cart";
import { CHECKOUT_IDEMPOTENCY_KEY_STORAGE_KEY } from "@/lib/checkout";

export function ClearCartOnMount() {
  const { clear } = useCart();
  const cleared = useRef(false);

  useEffect(() => {
    if (cleared.current) return;
    cleared.current = true;
    clear();
    window.sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY_STORAGE_KEY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
