import Link from "next/link";
import { getAdminOrders } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNaira } from "@/lib/utils";

const STATUSES = ["pending", "paid", "fulfilled", "failed", "cancelled"] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const orders = await getAdminOrders(status);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant={!status ? "default" : "outline"} size="sm">
          <Link href="/admin/orders">All</Link>
        </Button>
        {STATUSES.map((s) => (
          <Button key={s} asChild variant={status === s ? "default" : "outline"} size="sm">
            <Link href={`/admin/orders?status=${s}`}>{s}</Link>
          </Button>
        ))}
      </div>

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                    {order.paystack_reference}
                  </Link>
                </TableCell>
                <TableCell>{order.customer_email}</TableCell>
                <TableCell>{formatNaira(order.total_kobo)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{order.status}</Badge>
                </TableCell>
                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {orders.length === 0 && <p className="p-4 text-sm text-muted-foreground">No orders found.</p>}
      </div>
    </div>
  );
}
