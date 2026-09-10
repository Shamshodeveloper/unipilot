import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/server/auth";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign In" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ confirmation?: string; logout?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const params = await searchParams;
  return <main id="main-content" className="flex flex-1 items-center justify-center px-5 py-12 sm:py-20"><AuthForm mode="login" configured={Boolean(getSupabaseConfig())} confirmationFailed={params.confirmation === "failed"} localLogout={params.logout === "local"} /></main>;
}
