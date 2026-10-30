import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/storefront/product-card";
import { getFeaturedProducts } from "@/lib/data/catalog";

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <div>
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center">
        <svg
          viewBox="0 0 200 200"
          className="pointer-events-none absolute top-1/2 left-1/2 h-[min(70vw,560px)] w-[min(70vw,560px)] -translate-x-1/2 -translate-y-1/2 opacity-50"
        >
          <path
            d="M100 20 L140 45 L140 75 Q140 90 125 95 L125 150 Q125 165 110 170 L90 170 Q75 165 75 150 L75 95 Q60 90 60 75 L60 45 Z"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1"
            strokeDasharray="1400"
            className="animate-[atelier-draw_3.2s_cubic-bezier(0.4,0.1,0.2,1)_forwards]"
          />
        </svg>

        <p className="relative text-[11px] font-medium tracking-[0.22em] text-primary uppercase">
          New Arrivals
        </p>
        <h1 className="relative mt-4 max-w-2xl font-serif text-4xl leading-[1.05] tracking-tight sm:text-6xl">
          Good things, simply made.
        </h1>
        <p className="relative mt-5 max-w-md text-base text-muted-foreground">
          Browse our latest arrivals across apparel, accessories, and home goods.
        </p>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="relative mt-8 border-primary text-primary uppercase tracking-[0.1em] hover:bg-primary hover:text-primary-foreground"
        >
          <Link href="#featured">Shop now</Link>
        </Button>
      </section>

      <section id="featured" className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-serif text-2xl">Featured products</h2>
          <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            {products.length} pieces
          </p>
        </div>
        {products.length === 0 ? (
          <p className="text-muted-foreground">
            No products yet — add some from the admin dashboard.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
