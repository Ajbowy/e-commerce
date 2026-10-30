import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { emailSchema } from "@/lib/validation";
import { limiters, checkRateLimit, getClientIp } from "@/lib/rate-limit";

const forgotSchema = z.object({ email: emailSchema });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }
  const { email } = parsed.data;

  const ip = getClientIp(request);
  const { success } = await checkRateLimit(limiters.forgotPassword, `${ip}:${email.toLowerCase()}`);
  if (!success) {
    return Response.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/api/auth/callback?next=/reset-password`,
  });

  // Always return success, whether or not the email is registered, so this
  // endpoint can't be used to enumerate which emails have accounts.
  return Response.json({ success: true });
}
