import { z } from "zod";
import { requireAdminForApi } from "@/lib/admin-guard";
import { createServiceClient } from "@/lib/supabase/service";

const reorderSchema = z.object({ direction: z.enum(["up", "down"]) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { response } = await requireAdminForApi();
  if (response) return response;

  const { id: productId, imageId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: images, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error || !images) {
    return Response.json({ error: "Could not load images" }, { status: 400 });
  }

  const index = images.findIndex((img) => img.id === imageId);
  if (index === -1) {
    return Response.json({ error: "Image not found" }, { status: 404 });
  }

  const swapIndex = parsed.data.direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= images.length) {
    return Response.json({ image: images[index] });
  }

  const current = images[index];
  const swapWith = images[swapIndex];

  await Promise.all([
    supabase.from("product_images").update({ position: swapWith.position }).eq("id", current.id),
    supabase.from("product_images").update({ position: current.position }).eq("id", swapWith.id),
  ]);

  return Response.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { response } = await requireAdminForApi();
  if (response) return response;

  const { imageId } = await params;
  const supabase = createServiceClient();

  const { data: image } = await supabase
    .from("product_images")
    .select("*")
    .eq("id", imageId)
    .maybeSingle();

  if (!image) {
    return Response.json({ error: "Image not found" }, { status: 404 });
  }

  await supabase.storage.from("product-images").remove([image.storage_path]);
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return new Response(null, { status: 204 });
}
