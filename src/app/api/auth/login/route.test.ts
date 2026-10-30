import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/login/route";

const signInWithPassword = vi.fn();
const from = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { signInWithPassword },
    from,
  })),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
  getClientIp: vi.fn(() => "127.0.0.1"),
  limiters: {},
}));

describe("auth login route", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    from.mockReset();
  });

  it("redirects admins to the admin dashboard after successful sign-in", async () => {
    signInWithPassword.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
        }),
      }),
    });

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "admin@example.com", password: "Password!123" }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: true, redirectTo: "/admin" });
  });

  it("rejects invalid credentials", async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: new Error("Bad credentials") });

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "admin@example.com", password: "WrongPass!123" }),
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: "Invalid email or password." });
  });
});
