import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/utils";
import { ClearCartOnMount } from "@/components/storefront/clear-cart-on-mount";

const STATUS_COPY: Record<string, string> = {
  pending: "We're waiting for payment confirmation. This page will update once it's confirmed.",
  paid: "Payment confirmed - thank you for your order!",
  failed: "Payment declined. You have not been charged - you can return to your cart and try again.",
  fulfilled: "Payment confirmed - thank you for your order!",
  cancelled: "This order was cancelled.",
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  // Reads by the order's own uuid (an unguessable "confirmation ticket"),
  // so this works for guest checkouts with no logged-in session - not an
  // admin-only read, so the service-role client is appropriate here rather
  // than an RLS-gated owner-only query.
  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      {(order.status === "paid" || order.status === "fulfilled") && <ClearCartOnMount />}

      <h1 className="text-2xl font-semibold">Order {order.status === "paid" || order.status === "fulfilled" ? "confirmed" : "status"}</h1>
      <p className="mt-2 text-muted-foreground">{STATUS_COPY[order.status] ?? order.status}</p>

      <div className="mt-6 rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Order reference</p>
        <p className="font-mono text-sm">{order.paystack_reference}</p>

        <ul className="mt-4 divide-y">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex justify-between py-2 text-sm">
              <span>
                {item.product_name} x{item.quantity}
              </span>
              <span>{formatNaira(item.unit_price_kobo * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-between border-t pt-4 font-medium">
          <span>Total</span>
          <span>{formatNaira(order.total_kobo)}</span>
        </div>
      </div>

      <Button asChild className="mt-6">
        <Link href="/">Continue shopping</Link>
      </Button>
    </div>
  );
}
