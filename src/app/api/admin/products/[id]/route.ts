import { z } from "zod";
import { requireAdminForApi } from "@/lib/admin-guard";
import { createServiceClient } from "@/lib/supabase/service";

const productUpdateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  categoryId: z.uuid().nullable().optional(),
  description: z.string().optional(),
  priceKobo: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  isActive: z.boolean(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminForApi();
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      category_id: parsed.data.categoryId ?? null,
      description: parsed.data.description ?? null,
      price_kobo: parsed.data.priceKobo,
      stock: parsed.data.stock,
      is_active: parsed.data.isActive,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ product: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminForApi();
  if (response) return response;

  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return new Response(null, { status: 204 });
}
