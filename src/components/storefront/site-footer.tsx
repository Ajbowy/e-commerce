import { SITE_NAME } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
      </div>
    </footer>
  );
}
