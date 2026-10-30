"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_REQUIREMENTS } from "@/lib/validation";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName"));
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Could not create account.");
      setSubmitting(false);
      return;
    }

    setSubmittedEmail(email);
  }

  async function handleResend() {
    if (!submittedEmail) return;
    setResending(true);
    setResendMessage(null);

    const res = await fetch("/api/auth/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: submittedEmail }),
    });
    const data = await res.json();
    setResending(false);

    if (!res.ok) {
      setResendMessage(data.error ?? "Could not resend the email.");
      return;
    }

    setResendMessage("Email sent.");
    setResendCooldown(true);
    setTimeout(() => setResendCooldown(false), 60_000);
  }

  if (submittedEmail) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to <span className="font-medium">{submittedEmail}</span>.
          Click it to finish creating your account.
        </p>

        <Button
          variant="ghost"
          className="mt-4"
          onClick={handleResend}
          disabled={resending || resendCooldown}
        >
          {resendCooldown ? "Email sent - wait a moment" : resending ? "Sending..." : "Resend email"}
        </Button>
        {resendMessage && <p className="mt-1 text-xs text-muted-foreground">{resendMessage}</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="rounded-lg border p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Create an account</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">{PASSWORD_REQUIREMENTS}</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
