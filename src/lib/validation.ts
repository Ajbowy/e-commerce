import { z } from "zod";

// Enforced both client-side (for immediate feedback) and again in every auth
// API route (the client check alone can always be bypassed).
export const passwordSchema = z
  .string()
  .min(10, "Must be at least 10 characters")
  .regex(/[a-z]/, "Must include a lowercase letter")
  .regex(/[A-Z]/, "Must include an uppercase letter")
  .regex(/[0-9]/, "Must include a number")
  .regex(/[^a-zA-Z0-9]/, "Must include a special character");

export const emailSchema = z.email();

export const PASSWORD_REQUIREMENTS =
  "At least 10 characters, with uppercase, lowercase, a number, and a special character.";
