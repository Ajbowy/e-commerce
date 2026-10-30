import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/catalog";
import { primaryImageUrl } from "@/lib/product-image";
import { formatNaira } from "@/lib/utils";
import { AddToCartWithQuantity } from "@/components/storefront/add-to-cart-with-quantity";
import { MobileAddToCartBar } from "@/components/storefront/mobile-add-to-cart-bar";
import { TrustBadges } from "@/components/storefront/trust-badges";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductPlaceholder } from "@/components/storefront/product-placeholder";
import { Badge } from "@/components/ui/badge";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const imageUrl = primaryImageUrl(product);
  const relatedProducts = product.category_id
    ? await getRelatedProducts(product.category_id, product.id)
    : [];

  const cartProduct = {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    unitPriceKobo: product.price_kobo,
    imageUrl,
  };

  const detailRows = [
    { label: "Category", value: product.categories?.name ?? "General" },
    { label: "Availability", value: product.stock > 0 ? "In stock" : "Out of stock" },
    { label: "Style code", value: product.slug.toUpperCase() },
  ];

  return (
    <div className="pb-24 md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-14">
        {product.categories && (
          <Link
            href={`/category/${product.categories.slug}`}
            className="text-[11px] font-medium tracking-[0.22em] text-primary uppercase hover:underline"
          >
            {product.categories.name}
          </Link>
        )}

        <div className="mt-4 grid gap-16 md:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden border border-border bg-muted">
            {imageUrl ? (
              <Image src={imageUrl} alt={product.name} fill className="object-cover" sizes="50vw" />
            ) : (
              <ProductPlaceholder />
            )}
          </div>

          <div>
            <h1 className="font-serif text-3xl sm:text-4xl">{product.name}</h1>
            <p className="mt-3 text-xl text-primary">{formatNaira(product.price_kobo)}</p>

            {product.stock <= 0 ? (
              <Badge variant="destructive" className="mt-3">
                Out of stock
              </Badge>
            ) : product.stock <= 5 ? (
              <Badge variant="secondary" className="mt-3">
                Only {product.stock} left
              </Badge>
            ) : null}

            {product.description && (
              <p className="mt-5 max-w-[48ch] text-muted-foreground">{product.description}</p>
            )}

            <div className="mt-6 border-t border-border">
              {detailRows.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between border-b border-border py-3.5 text-sm"
                >
                  <span className="text-muted-foreground">{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 hidden md:block">
              <AddToCartWithQuantity product={cartProduct} disabled={product.stock <= 0} />
            </div>

            <TrustBadges />
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-20 border-t border-border pt-12">
            <h2 className="mb-6 font-serif text-2xl">You may also like</h2>
            <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </section>
        )}
      </div>

      <MobileAddToCartBar product={cartProduct} priceKobo={product.price_kobo} disabled={product.stock <= 0} />
    </div>
  );
}
