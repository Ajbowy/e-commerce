import "server-only";
import { requireAdmin } from "@/lib/dal";
import { createServiceClient } from "@/lib/supabase/service";
import type { OrderStatus } from "@/types/database";

const ORDER_STATUSES: OrderStatus[] = ["pending", "paid", "failed", "fulfilled", "cancelled"];

export async function getAdminStats() {
  await requireAdmin();
  const supabase = createServiceClient();

  const [{ count: productCount }, { count: pendingCount }, { count: paidCount }, { data: recentOrders }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "paid"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5),
    ]);

  return {
    productCount: productCount ?? 0,
    pendingCount: pendingCount ?? 0,
    paidCount: paidCount ?? 0,
    recentOrders: recentOrders ?? [],
  };
}

export async function getAdminProducts() {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAdminProductById(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAdminOrders(status?: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (status && ORDER_STATUSES.includes(status as OrderStatus)) {
    query = query.eq("status", status as OrderStatus);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getAdminOrderById(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
