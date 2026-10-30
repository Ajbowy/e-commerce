"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CartButton } from "@/components/storefront/cart-button";
import { signOut } from "@/lib/actions/auth";
import { SITE_NAME } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function SiteHeaderNav({
  categories,
  profile,
}: {
  categories: Array<{ id: string; slug: string; name: string }>;
  profile: { role: string } | null;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-6 px-4">
        <Link href="/" className="font-serif text-xl tracking-[0.06em]">
          {SITE_NAME}
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden flex-1 items-center justify-center gap-9 text-[13px] font-medium tracking-[0.08em] uppercase md:flex"
        >
          {categories.map((category) => {
            const href = `/category/${category.slug}`;
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={category.id}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative py-1 transition-colors",
                  isActive
                    ? "text-foreground after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-primary"
                    : "text-muted-foreground after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:text-foreground hover:after:scale-x-100"
                )}
              >
                {category.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <CartButton />
          {profile ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={profile.role === "admin" ? "/admin" : "/account"}>
                  {profile.role === "admin" ? "Admin" : "Account"}
                </Link>
              </Button>
              <form action={signOut}>
                <Button variant="ghost" size="sm" type="submit">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
