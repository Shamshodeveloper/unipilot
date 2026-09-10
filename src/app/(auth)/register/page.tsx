import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/server/auth";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Register" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <main id="main-content" className="flex flex-1 items-center justify-center px-5 py-12 sm:py-20"><AuthForm mode="register" configured={Boolean(getSupabaseConfig())} /></main>;
}
