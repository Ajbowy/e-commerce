import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyTransaction } from "@/lib/paystack";
import { logWebhookIssue } from "@/lib/monitoring";

type PaystackWebhookEvent = {
  event?: string;
  data?: {
    reference?: string;
  };
};

async function markFailedIfPending(reference: string) {
  const supabase = createServiceClient();
  // Idempotent: only transitions pending -> failed, so a redelivered/
  // duplicate webhook can't stomp on a status set by something else.
  await supabase
    .from("orders")
    .update({ status: "failed" })
    .eq("paystack_reference", reference)
    .eq("status", "pending");
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    logWebhookIssue("missing_secret");
    return new Response(null, { status: 500 });
  }

  const expectedSignature = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");

  // Reject anything that isn't provably from Paystack. This is the crux of
  // never trusting a client-reported payment status.
  if (!signature || signature !== expectedSignature) {
    logWebhookIssue("signature_mismatch", { hasSignature: Boolean(signature) });
    return new Response(null, { status: 401 });
  }

  let event: PaystackWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PaystackWebhookEvent;
  } catch (error) {
    logWebhookIssue("invalid_json", { error: error instanceof Error ? error.message : String(error) });
    return new Response(null, { status: 400 });
  }
  const reference: string | undefined = event.data?.reference;

  if (event.event === "charge.failed") {
    if (reference) await markFailedIfPending(reference);
    return new Response(null, { status: 200 });
  }

  if (event.event !== "charge.success") {
    return new Response(null, { status: 200 });
  }

  if (!reference) {
    logWebhookIssue("missing_reference", { event });
    return new Response(null, { status: 400 });
  }

  // Second confirmation directly from Paystack's API, independent of the
  // webhook body, before touching order status.
  let verification;
  try {
    verification = await verifyTransaction(reference);
  } catch (error) {
    logWebhookIssue("verification_failed", {
      reference,
      error: error instanceof Error ? error.message : String(error),
    });
    await markFailedIfPending(reference);
    return new Response(null, { status: 200 });
  }

  if (verification.data.status !== "success") {
    // Declined/abandoned - don't leave the order stuck "pending" forever.
    logWebhookIssue("payment_not_successful", {
      reference,
      status: verification.data.status,
    });
    await markFailedIfPending(reference);
    return new Response(null, { status: 200 });
  }

  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("paystack_reference", reference)
    .maybeSingle();

  if (!order) {
    return new Response(null, { status: 404 });
  }

  if (verification.data.amount !== order.total_kobo) {
    logWebhookIssue("amount_mismatch", {
      reference,
      expectedAmount: order.total_kobo,
      verifiedAmount: verification.data.amount,
    });
    await markFailedIfPending(reference);
    return new Response(null, { status: 400 });
  }

  // Idempotent: only transitions pending -> paid. If Paystack redelivers this
  // webhook, the second call updates zero rows and stock is not double-decremented.
  const { data: updatedOrders, error: updateError } = await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("paystack_reference", reference)
    .eq("status", "pending")
    .select();

  if (!updateError && updatedOrders && updatedOrders.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", order.id);

    for (const item of items ?? []) {
      if (!item.product_id) continue;
      await supabase.rpc("decrement_product_stock", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });
    }
  }

  return new Response(null, { status: 200 });
}
