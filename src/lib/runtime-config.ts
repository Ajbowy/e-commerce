export const REQUIRED_PRODUCTION_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "PAYSTACK_SECRET_KEY",
  "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

export function isProductionReady(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return REQUIRED_PRODUCTION_ENV.every((key) => Boolean(process.env[key]?.trim()));
}

export function assertProductionEnv(): true {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const missing = REQUIRED_PRODUCTION_ENV.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `[runtime-config] Missing required production environment variables: ${missing.join(", ")}`
    );
  }

  return true;
}
