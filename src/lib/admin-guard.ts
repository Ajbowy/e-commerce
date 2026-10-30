import "server-only";
import { getProfile } from "@/lib/dal";

/**
 * Re-checks admin status inside a Route Handler (defense in depth alongside
 * admin/layout.tsx's redirect guard - Next.js layouts can be skipped on
 * client-side partial navigations, so mutation endpoints re-verify here).
 * Returns the profile on success, or a 403 Response to return immediately.
 */
export async function requireAdminForApi() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return { profile: null, response: new Response(null, { status: 403 }) } as const;
  }
  return { profile, response: null } as const;
}
