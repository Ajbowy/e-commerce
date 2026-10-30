import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin/products/route";

const from = vi.fn();

vi.mock("@/lib/admin-guard", () => ({
  requireAdminForApi: vi.fn().mockResolvedValue({ response: null, profile: { role: "admin" } }),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => ({
    from,
  })),
}));

describe("admin product creation route", () => {
  beforeEach(() => {
    from.mockReset();
  });

  it("creates a product for admins", async () => {
    from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "product-1", name: "Test Product" },
            error: null,
          }),
        }),
      }),
    });

    const response = await POST(
      new Request("http://localhost/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          name: "Test Product",
          slug: "test-product",
          priceKobo: 2500,
          stock: 12,
          isActive: true,
        }),
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      product: { id: "product-1", name: "Test Product" },
    });
  });

  it("rejects malformed payloads", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/products", {
        method: "POST",
        body: JSON.stringify({ name: "", slug: "" }),
      })
    );

    expect(response.status).toBe(400);
  });
});
