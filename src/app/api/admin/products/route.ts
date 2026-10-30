import { z } from "zod";
import { requireAdminForApi } from "@/lib/admin-guard";
import { createServiceClient } from "@/lib/supabase/service";

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  categoryId: z.uuid().nullable().optional(),
  description: z.string().optional(),
  priceKobo: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  isActive: z.boolean(),
});

export async function POST(request: Request) {
  const { response } = await requireAdminForApi();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      category_id: parsed.data.categoryId ?? null,
      description: parsed.data.description ?? null,
      price_kobo: parsed.data.priceKobo,
      stock: parsed.data.stock,
      is_active: parsed.data.isActive,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ product: data }, { status: 201 });
}
