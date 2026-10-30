"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { passwordSchema, PASSWORD_REQUIREMENTS } from "@/lib/validation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password"));
    const confirmPassword = String(formData.get("confirmPassword"));

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    const validation = passwordSchema.safeParse(password);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Password does not meet requirements.");
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(
        "Could not reset your password. Your reset link may have expired - request a new one."
      );
      setSubmitting(false);
      return;
    }

    router.replace("/account");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="rounded-lg border p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Set a new password</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" required className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">{PASSWORD_REQUIREMENTS}</p>
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="mt-1"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving..." : "Save new password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
