import { notFound } from "next/navigation";
import { getCategories } from "@/lib/data/catalog";
import { getAdminProductById } from "@/lib/data/admin";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [categories, product] = await Promise.all([getCategories(), getAdminProductById(id)]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <div className="mt-6">
        <ProductForm categories={categories} product={product} />
      </div>
    </div>
  );
}
