import { getProfile } from "@/lib/dal";
import { getCategories } from "@/lib/data/catalog";
import { SiteHeaderNav } from "@/components/storefront/site-header-nav";

export async function SiteHeader() {
  const [profile, categories] = await Promise.all([getProfile(), getCategories()]);

  return <SiteHeaderNav categories={categories} profile={profile} />;
}
