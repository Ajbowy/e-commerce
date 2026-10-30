import Link from "next/link";
import { getAdminStats } from "@/lib/data/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const { productCount, pendingCount, paidCount, recentOrders } = await getAdminStats();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Products</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{productCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pending orders</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{pendingCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Paid orders</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{paidCount}</CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-medium">Recent orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {recentOrders.map((order) => (
              <li key={order.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                  {order.paystack_reference}
                </Link>
                <span className="text-muted-foreground">{order.status}</span>
                <span>{formatNaira(order.total_kobo)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
