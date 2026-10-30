import { notFound } from "next/navigation";
import { getAdminOrderById } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/utils";
import { OrderStatusActions } from "@/components/admin/order-status-actions";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrderById(id);
  if (!order) notFound();

  const address = order.shipping_address as Record<string, string> | null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Order {order.paystack_reference}</h1>
        <Badge variant="outline">{order.status}</Badge>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-muted-foreground">Customer</p>
          <p>{order.customer_email}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Date</p>
          <p>{new Date(order.created_at).toLocaleString()}</p>
        </div>
        {address && (
          <div className="col-span-2">
            <p className="text-muted-foreground">Shipping address</p>
            <p>
              {address.fullName}, {address.address}, {address.city}, {address.state}
            </p>
            <p>{address.phone}</p>
          </div>
        )}
      </div>

      <ul className="mt-6 divide-y rounded-lg border">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex justify-between px-4 py-3 text-sm">
            <span>
              {item.product_name} x{item.quantity}
            </span>
            <span>{formatNaira(item.unit_price_kobo * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-between text-lg font-medium">
        <span>Total</span>
        <span>{formatNaira(order.total_kobo)}</span>
      </div>

      <div className="mt-6">
        <OrderStatusActions orderId={order.id} status={order.status} />
      </div>
    </div>
  );
}
