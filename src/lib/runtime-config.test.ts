import { describe, expect, it } from "vitest";
import { assertProductionEnv, isProductionReady } from "@/lib/runtime-config";

describe("runtime-config", () => {
  it("returns true when all required production env values are present", () => {
    const originalEnv = { ...process.env };
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    process.env.PAYSTACK_SECRET_KEY = "secret";
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = "public";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";

    expect(isProductionReady()).toBe(true);
    expect(() => assertProductionEnv()).not.toThrow();

    process.env = originalEnv;
  });

  it("throws when required production settings are missing", () => {
    const originalEnv = { ...process.env };
    process.env.NODE_ENV = "production";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.PAYSTACK_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    expect(isProductionReady()).toBe(false);
    expect(() => assertProductionEnv()).toThrow(/missing/i);

    process.env = originalEnv;
  });
});
