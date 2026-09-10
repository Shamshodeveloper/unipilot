"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/server/site-url";
import { authErrorMessage, loginSchema, registerSchema, type AuthFormState } from "@/lib/validation/auth";

export async function login(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const result = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!result.success) return { fieldErrors: result.error.flatten().fieldErrors };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(result.data);
    if (error) return { error: authErrorMessage(error) };
  } catch {
    return { error: "Sign in is unavailable right now. Please try again shortly." };
  }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function register(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const result = registerSchema.safeParse({
    email: formData.get("email"), password: formData.get("password"), confirmPassword: formData.get("confirmPassword"),
  });
  if (!result.success) return { fieldErrors: result.error.flatten().fieldErrors };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` },
    });
    if (error) return { error: authErrorMessage(error) };
    if (!data.session) {
      // Supabase may intentionally mask duplicate accounts when confirmation is enabled.
      return { message: "Check your inbox for a confirmation link before signing in. If you already have an account with this email, use Sign In instead." };
    }
  } catch {
    return { error: "Registration is unavailable right now. Please try again shortly." };
  }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout(): Promise<AuthFormState> {
  let destination = "/login";
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      // Supabase can clear local cookies even when remote session revocation fails.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return { error: "We couldn’t sign you out. Please try again." };
      destination = "/login?logout=local";
    }
  } catch {
    return { error: "We couldn’t sign you out. Please check your connection and try again." };
  }
  revalidatePath("/", "layout");
  redirect(destination);
}
