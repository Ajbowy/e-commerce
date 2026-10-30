"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { formatNaira } from "@/lib/utils";
import { CHECKOUT_IDEMPOTENCY_KEY_STORAGE_KEY } from "@/lib/checkout";

function getOrCreateIdempotencyKey() {
  const existing = window.sessionStorage.getItem(CHECKOUT_IDEMPOTENCY_KEY_STORAGE_KEY);
  if (existing) return existing;
  const key = crypto.randomUUID();
  window.sessionStorage.setItem(CHECKOUT_IDEMPOTENCY_KEY_STORAGE_KEY, key);
  return key;
}

export default function CheckoutPage() {
  const { items, subtotalKobo } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl">Your cart is empty</h1>
        <Button asChild className="mt-6">
          <Link href="/">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email")),
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      shippingAddress: {
        fullName: String(formData.get("fullName")),
        phone: String(formData.get("phone")),
        address: String(formData.get("address")),
        city: String(formData.get("city")),
        state: String(formData.get("state")),
      },
      idempotencyKey: getOrCreateIdempotencyKey(),
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.status === 409 && data.orderId) {
        // Already paid in a previous attempt with this same idempotency key.
        window.location.href = `/order-confirmation/${data.orderId}`;
        return;
      }

      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Something went wrong starting checkout."
        );
        setSubmitting(false);
        return;
      }

      window.location.href = data.authorizationUrl;
    } catch {
      setError("Could not reach the server. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="mb-8 font-serif text-2xl">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" name="address" required className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" required className="mt-1" />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="font-serif text-lg">Total</span>
          <span className="font-serif text-lg text-primary">{formatNaira(subtotalKobo)}</span>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Redirecting to payment..." : "Pay with Paystack"}
        </Button>
      </form>
    </div>
  );
}
