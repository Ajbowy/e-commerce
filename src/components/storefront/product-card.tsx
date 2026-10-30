import Image from "next/image";
import Link from "next/link";
import { formatNaira } from "@/lib/utils";
import { primaryImageUrl, type ProductWithImages } from "@/lib/product-image";
import { ProductPlaceholder } from "@/components/storefront/product-placeholder";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";

export function ProductCard({ product }: { product: ProductWithImages }) {
  const imageUrl = primaryImageUrl(product);

  return (
    <div className="group relative bg-background p-5">
      <span className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
      <span className="absolute inset-y-0 right-0 w-px origin-top scale-y-0 bg-primary transition-transform delay-100 duration-300 group-hover:scale-y-100" />
      <span className="absolute inset-x-0 bottom-0 h-px origin-right scale-x-0 bg-primary transition-transform delay-200 duration-300 group-hover:scale-x-100" />
      <span className="absolute inset-y-0 left-0 w-px origin-bottom scale-y-0 bg-primary transition-transform delay-300 duration-300 group-hover:scale-y-100" />

      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(min-width: 1024px) 25vw, 50vw"
            />
          ) : (
            <ProductPlaceholder />
          )}
        </div>
      </Link>

      <div className="mt-5">
        {product.categories && (
          <p className="text-[11px] font-medium tracking-[0.16em] text-primary uppercase">
            {product.categories.name}
          </p>
        )}
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="mt-1.5 font-serif text-lg leading-snug hover:underline">{product.name}</h3>
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">{formatNaira(product.price_kobo)}</p>
      </div>

      <AddToCartButton
        product={{
          productId: product.id,
          name: product.name,
          slug: product.slug,
          unitPriceKobo: product.price_kobo,
          imageUrl,
        }}
        disabled={product.stock <= 0}
        variant="outline"
        className="relative mt-4 w-full"
      />
    </div>
  );
}
