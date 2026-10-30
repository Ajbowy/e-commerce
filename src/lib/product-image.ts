import type { Database } from "@/types/database";

export type ProductWithImages = Database["public"]["Tables"]["products"]["Row"] & {
  product_images: Pick<Database["public"]["Tables"]["product_images"]["Row"], "storage_path" | "position">[];
  categories?: Pick<Database["public"]["Tables"]["categories"]["Row"], "name" | "slug"> | null;
};

export function productImageUrl(storagePath: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/product-images/${storagePath}`;
}

export function primaryImageUrl(product: ProductWithImages) {
  const [first] = [...product.product_images].sort((a, b) => a.position - b.position);
  return first ? productImageUrl(first.storage_path) : null;
}
