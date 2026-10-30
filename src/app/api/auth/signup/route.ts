import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { limiters, checkRateLimit, getClientIp } from "@/lib/rate-limit";

const signupSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: emailSchema,
  password: passwordSchema,
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { fullName, email, password } = parsed.data;

  const ip = getClientIp(request);
  const { success } = await checkRateLimit(limiters.signup, `${ip}:${email.toLowerCase()}`);
  if (!success) {
    return Response.json(
      { error: "Too many signup attempts. Please try again later." },
      { status: 429 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl}/api/auth/callback`,
    },
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ success: true });
}
