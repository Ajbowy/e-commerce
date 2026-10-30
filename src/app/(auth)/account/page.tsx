import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser, getProfile } from "@/lib/dal";
import { Button } from "@/components/ui/button";

export default async function AccountPage() {
  const user = await requireUser();
  const profile = await getProfile();

  // Admin and customer views are kept fully separate - admins are always
  // routed to the admin dashboard instead of the customer account page.
  if (profile?.role === "admin") redirect("/admin");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Your account</h1>

      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between border-b py-2">
          <dt className="text-muted-foreground">Name</dt>
          <dd>{profile?.full_name ?? "-"}</dd>
        </div>
        <div className="flex justify-between border-b py-2">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{user.email}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href="/account/orders">Order history</Link>
        </Button>
      </div>
    </div>
  );
}
