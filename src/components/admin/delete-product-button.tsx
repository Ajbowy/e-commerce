"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete "${productName}"? This cannot be undone.`)) return;

    setDeleting(true);
    const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      toast.error("Could not delete product");
      return;
    }

    toast.success("Product deleted");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleting}>
      {deleting ? "Deleting..." : "Delete"}
    </Button>
  );
}
