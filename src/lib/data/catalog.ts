import "server-only";
import { createClient } from "@/lib/supabase/server";

export type { ProductWithImages } from "@/lib/product-image";

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProductsByCategoryId(categoryId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(storage_path, position), categories(name, slug)")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getRelatedProducts(categoryId: string, excludeProductId: string, limit = 4) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(storage_path, position), categories(name, slug)")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .neq("id", excludeProductId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getFeaturedProducts(limit = 8) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(storage_path, position), categories(name, slug)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(storage_path, position), categories(name, slug)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

