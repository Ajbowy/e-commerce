import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SITE_NAME } from "@/lib/site-config";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/admin" className="text-lg font-semibold tracking-tight">
            {SITE_NAME} Admin
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            Back to store
          </Link>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-8">
        <AdminSidebar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
