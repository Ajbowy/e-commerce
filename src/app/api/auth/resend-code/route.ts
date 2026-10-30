import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { emailSchema } from "@/lib/validation";
import { limiters, checkRateLimit, getClientIp } from "@/lib/rate-limit";

const resendSchema = z.object({ email: emailSchema });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resendSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }
  const { email } = parsed.data;

  const ip = getClientIp(request);
  const { success } = await checkRateLimit(limiters.resendCode, email.toLowerCase());
  if (!success) {
    return Response.json(
      { error: "Please wait a moment before requesting another email." },
      { status: 429 }
    );
  }
  // Also rate-limit by IP so one IP can't cycle through many emails.
  const { success: ipOk } = await checkRateLimit(limiters.resendCode, ip);
  if (!ipOk) {
    return Response.json(
      { error: "Please wait a moment before requesting another email." },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ success: true });
}
