import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth";

export async function loadDashboard() {
  const user = await requireUser();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [subjects, exams, materials, topics, learning, review, mastered] = await Promise.all([
    supabase.from("subjects").select("id, name, description", { count: "exact" }).eq("user_id", user.id).order("created_at", { ascending: false }).order("id").limit(12),
    supabase.from("exams").select("id, title, exam_date").eq("user_id", user.id).gte("exam_date", today).order("exam_date").order("id").limit(5),
    supabase.from("materials").select("id, file_name, mime_type, size_bytes, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).order("id").limit(5),
    supabase.from("topics").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("topic_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "learning"),
    supabase.from("topic_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "needs_review"),
    supabase.from("topic_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "mastered"),
  ]);
  const failed = [topics, learning, review, mastered].some((result) => result.error || result.count === null);
  // Topics without a progress row count as not started; exact counts avoid row limits.
  const progress = failed ? null : {
    total: topics.count!,
    not_started: Math.max(0, topics.count! - learning.count! - review.count! - mastered.count!),
    learning: learning.count!, needs_review: review.count!, mastered: mastered.count!,
  };
  return { subjects, exams, materials, progress };
}
