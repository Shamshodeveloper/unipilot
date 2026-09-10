import { z } from "zod";

const email = z.string().trim().email("Enter a valid email address.").max(254, "Email address is too long.");
const password = z.string().min(1, "Enter your password.").max(128, "Use at most 128 characters.");

export const loginSchema = z.object({ email, password });

export const registerSchema = z.object({
  email,
  password: password.min(8, "Use at least 8 characters."),
  confirmPassword: z.string().min(1, "Confirm your password.").max(128, "Use at most 128 characters."),
}).refine((values) => values.password === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match.",
});

export type AuthFormState = {
  error?: string;
  message?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "confirmPassword", string[]>>;
};

export function authErrorMessage(error: { code?: string; status?: number }) {
  switch (error.code) {
    case "invalid_credentials":
      return "The email or password is incorrect. Please try again.";
    case "email_not_confirmed":
      return "Confirm your email using the link in your inbox, then sign in.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Please sign in.";
    case "weak_password":
      return "Choose a stronger password with a mix of letters, numbers, and symbols.";
    case "email_address_invalid":
      return "Enter a valid email address.";
    case "email_address_not_authorized":
      return "Email delivery is not available for this address yet. Please contact UniPilot support.";
    case "signup_disabled":
      return "Registration is temporarily unavailable. Please try again later.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a few minutes before trying again.";
    default:
      return error.status === 429
        ? "Too many attempts. Please wait a few minutes before trying again."
        : "We couldn’t complete your request. Please try again shortly.";
  }
}
