import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const getCurrentUser = cache(async () => {
  if (!getSupabaseConfig()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function ensureProfile() {
  // Never accept the profile owner from a form or unverified cookie payload.
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert(
    { id: user.id },
    { onConflict: "id", ignoreDuplicates: true },
  );
  return !error;
}
