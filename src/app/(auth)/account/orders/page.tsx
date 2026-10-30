import { redirect } from "next/navigation";
import { requireUser, getProfile } from "@/lib/dal";
import { getMyOrders } from "@/lib/data/orders";
import { formatNaira } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  paid: "secondary",
  fulfilled: "default",
  failed: "destructive",
  cancelled: "destructive",
};

export default async function OrderHistoryPage() {
  await requireUser();
  const profile = await getProfile();
  if (profile?.role === "admin") redirect("/admin");
  const orders = await getMyOrders();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Order history</h1>

      {orders.length === 0 ? (
        <p className="mt-6 text-muted-foreground">You haven&apos;t placed any orders yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-muted-foreground">
                  {order.paystack_reference}
                </span>
                <Badge variant={STATUS_VARIANT[order.status] ?? "outline"}>{order.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.product_name} x{item.quantity}
                    </span>
                    <span>{formatNaira(item.unit_price_kobo * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t pt-3 text-sm font-medium">
                <span>Total</span>
                <span>{formatNaira(order.total_kobo)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
