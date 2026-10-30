import { getCategories } from "@/lib/data/catalog";
import { requireAdmin } from "@/lib/dal";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <div>
      <h1 className="text-2xl font-semibold">New product</h1>
      <div className="mt-6">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
