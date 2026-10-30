import { randomUUID } from "crypto";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { initializeTransaction } from "@/lib/paystack";
import { getUser } from "@/lib/dal";
import { limiters, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logCheckoutIssue } from "@/lib/monitoring";

const checkoutSchema = z.object({
  email: z.email(),
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  shippingAddress: z.record(z.string(), z.unknown()).optional(),
  // Generated once by the client per checkout attempt, so a retried or
  // double-submitted request reuses the same order instead of creating a
  // duplicate (and double-reserving stock).
  idempotencyKey: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    logCheckoutIssue("validation_failed", { issues: parsed.error.flatten() });
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, items, shippingAddress, idempotencyKey } = parsed.data;

  const ip = getClientIp(request);
  const { success: rateOk } = await checkRateLimit(limiters.checkout, ip);
  if (!rateOk) {
    return Response.json(
      { error: "Too many checkout attempts. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const supabase = createServiceClient();
  const user = await getUser();

  const { data: existingOrder } = await supabase
    .from("orders")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingOrder) {
    if (existingOrder.status === "paid" || existingOrder.status === "fulfilled") {
      return Response.json(
        { error: "This order has already been paid for.", orderId: existingOrder.id },
        { status: 409 }
      );
    }
    if (existingOrder.status === "pending") {
      // Same attempt retried (e.g. a flaky connection) - re-issue a fresh
      // Paystack transaction against the SAME order instead of creating a
      // second one.
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const newReference = `ord_${randomUUID()}`;

      try {
        const paystackRes = await initializeTransaction({
          email,
          amountKobo: existingOrder.total_kobo,
          reference: newReference,
          callbackUrl: `${siteUrl}/order-confirmation/${existingOrder.id}`,
        });

        await supabase
          .from("orders")
          .update({ paystack_reference: newReference })
          .eq("id", existingOrder.id);

        return Response.json({
          authorizationUrl: paystackRes.data.authorization_url,
          orderId: existingOrder.id,
        });
      } catch (error) {
        logCheckoutIssue("reissue_payment_failed", {
          orderId: existingOrder.id,
          reference: newReference,
          error: error instanceof Error ? error.message : String(error),
        });
        return Response.json({ error: "Could not start payment" }, { status: 502 });
      }
    }
    // failed/cancelled - fall through and create a brand-new order below.
  }

  const productIds = items.map((item) => item.productId);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds);

  if (productsError || !products) {
    logCheckoutIssue("product_lookup_failed", { error: productsError?.message ?? "No products returned" });
    return Response.json({ error: "Could not load products" }, { status: 500 });
  }

  // Server-side source of truth for price and stock — the client's cart
  // never dictates what gets charged.
  let totalKobo = 0;
  const orderItemsInput: {
    product_id: string;
    product_name: string;
    unit_price_kobo: number;
    quantity: number;
  }[] = [];

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || !product.is_active) {
      logCheckoutIssue("product_unavailable", { productId: item.productId, quantity: item.quantity });
      return Response.json({ error: "One or more products are unavailable" }, { status: 400 });
    }
    if (product.stock < item.quantity) {
      logCheckoutIssue("stock_insufficient", {
        productId: item.productId,
        requested: item.quantity,
        available: product.stock,
      });
      return Response.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
    }
    totalKobo += product.price_kobo * item.quantity;
    orderItemsInput.push({
      product_id: product.id,
      product_name: product.name,
      unit_price_kobo: product.price_kobo,
      quantity: item.quantity,
    });
  }

  const reference = `ord_${randomUUID()}`;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      status: "pending",
      total_kobo: totalKobo,
      paystack_reference: reference,
      idempotency_key: idempotencyKey,
      customer_email: email,
      shipping_address: shippingAddress ?? null,
    })
    .select()
    .single();

  if (orderError || !order) {
    logCheckoutIssue("order_creation_failed", { error: orderError?.message ?? "missing order" });
    return Response.json({ error: "Could not create order" }, { status: 500 });
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsInput.map((item) => ({ ...item, order_id: order.id })));

  if (itemsError) {
    logCheckoutIssue("order_items_failed", { orderId: order.id, error: itemsError.message });
    await supabase.from("orders").delete().eq("id", order.id);
    return Response.json({ error: "Could not create order items" }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const paystackRes = await initializeTransaction({
      email,
      amountKobo: totalKobo,
      reference,
      callbackUrl: `${siteUrl}/order-confirmation/${order.id}`,
    });

    return Response.json({
      authorizationUrl: paystackRes.data.authorization_url,
      orderId: order.id,
    });
  } catch (error) {
    logCheckoutIssue("paystack_init_failed", {
      orderId: order.id,
      reference,
      error: error instanceof Error ? error.message : String(error),
    });
    await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
    return Response.json({ error: "Could not start payment" }, { status: 502 });
  }
}
