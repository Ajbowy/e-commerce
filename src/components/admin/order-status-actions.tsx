"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function OrderStatusActions({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  if (status !== "paid") return null;

  async function updateStatus(next: "fulfilled" | "cancelled") {
    setUpdating(true);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setUpdating(false);

    if (!res.ok) {
      toast.error("Could not update order");
      return;
    }

    toast.success(`Order marked ${next}`);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={updating} onClick={() => updateStatus("fulfilled")}>
        Mark fulfilled
      </Button>
      <Button size="sm" variant="outline" disabled={updating} onClick={() => updateStatus("cancelled")}>
        Cancel order
      </Button>
    </div>
  );
}
