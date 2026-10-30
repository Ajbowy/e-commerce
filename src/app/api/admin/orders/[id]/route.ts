import { z } from "zod";
import { requireAdminForApi } from "@/lib/admin-guard";
import { createServiceClient } from "@/lib/supabase/service";

// Admins can only move an order forward to fulfilled or cancel it - "paid"
// is set exclusively by the Paystack webhook after signature verification.
const ALLOWED_STATUSES = ["fulfilled", "cancelled"] as const;
const statusSchema = z.object({ status: z.enum(ALLOWED_STATUSES) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminForApi();
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: order } = await supabase.from("orders").select("status").eq("id", id).maybeSingle();

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "paid") {
    return Response.json(
      { error: "Only paid orders can be fulfilled or cancelled" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ order: data });
}
