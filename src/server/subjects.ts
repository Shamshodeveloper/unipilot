import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth";
import { subjectIdSchema } from "@/lib/validation/subjects";

export async function listSubjects() {
  const user = await requireUser();
  const supabase = await createClient();
  const subjects = [];
  // Fetch every page rather than silently truncating at the API's row limit.
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("subjects")
      .select("id, name, description, instructor").eq("user_id", user.id)
      .order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
    if (error) throw new Error("Could not load subjects.");
    subjects.push(...data);
    if (data.length < 500) return subjects;
  }
}

export async function getSubject(id: string) {
  const user = await requireUser();
  if (!subjectIdSchema.safeParse(id).success) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase.from("subjects")
    .select("id, name, description, instructor").eq("user_id", user.id).eq("id", id).maybeSingle();
  if (error) throw new Error("Could not load subject.");
  if (!data) notFound();
  return data;
}
