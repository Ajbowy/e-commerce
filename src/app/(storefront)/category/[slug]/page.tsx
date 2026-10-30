import { notFound } from "next/navigation";
import { ProductCard } from "@/components/storefront/product-card";
import { getCategoryBySlug, getProductsByCategoryId } from "@/lib/data/catalog";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const products = await getProductsByCategoryId(category.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <p className="text-[11px] font-medium tracking-[0.22em] text-primary uppercase">Collection</p>
      <h1 className="mt-2 mb-8 font-serif text-3xl">{category.name}</h1>
      {products.length === 0 ? (
        <p className="text-muted-foreground">No products in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
