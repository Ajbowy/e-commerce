import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { emailSchema } from "@/lib/validation";
import { limiters, checkRateLimit, getClientIp } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Enter a valid email and password." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const ip = getClientIp(request);
  const { success } = await checkRateLimit(limiters.login, `${ip}:${email.toLowerCase()}`);
  if (!success) {
    return Response.json(
      { error: "Too many login attempts. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return Response.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  return Response.json({
    success: true,
    redirectTo: profile?.role === "admin" ? "/admin" : "/account",
  });
}
