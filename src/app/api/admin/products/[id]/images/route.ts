import { randomUUID } from "crypto";
import { requireAdminForApi } from "@/lib/admin-guard";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminForApi();
  if (response) return response;

  const { id: productId } = await params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { count } = await supabase
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);

  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${productId}/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(storagePath, file, { contentType: file.type });

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, storage_path: storagePath, position: count ?? 0 })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ image: data }, { status: 201 });
}
