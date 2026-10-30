import Link from "next/link";
import { SITE_NAME } from "@/lib/site-config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-atelier flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link href="/" className="font-serif text-lg tracking-wide">
            {SITE_NAME}
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
