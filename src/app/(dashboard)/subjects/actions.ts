"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { subjectIdSchema, subjectSchema, type SubjectFormState } from "@/lib/validation/subjects";

function refreshSubjects(id: string) {
  revalidatePath("/dashboard");
  revalidatePath("/subjects");
  revalidatePath(`/subjects/${id}`);
  revalidatePath(`/subjects/${id}/edit`);
}

export async function saveSubject(_previous: SubjectFormState, formData: FormData): Promise<SubjectFormState> {
  const user = await requireUser();
  const id = formData.get("subjectId");
  if (id !== null && (typeof id !== "string" || !subjectIdSchema.safeParse(id).success)) return { error: "Subject not found or unavailable." };
  const input = { name: formData.get("name"), description: formData.get("description") ?? "", instructor: formData.get("instructor") ?? "" };
  const values = {
    name: typeof input.name === "string" ? input.name.slice(0, 201) : "",
    description: typeof input.description === "string" ? input.description.slice(0, 5001) : "",
    instructor: typeof input.instructor === "string" ? input.instructor.slice(0, 201) : "",
  };
  const result = subjectSchema.safeParse(input);
  if (!result.success) return { fieldErrors: result.error.flatten().fieldErrors, values };
  let savedId: string;
  try {
    const supabase = await createClient();
    const query = id === null
      ? supabase.from("subjects").insert({ ...result.data, user_id: user.id })
      : supabase.from("subjects").update(result.data).eq("id", id).eq("user_id", user.id);
    const { data, error } = await query.select("id").maybeSingle();
    if (error) return { error: "We couldn’t save this subject. Please try again.", values };
    if (!data) return { error: "Subject not found or unavailable.", values };
    savedId = data.id;
  } catch {
    return { error: "We couldn’t save this subject. Please try again.", values };
  }
  refreshSubjects(savedId);
  redirect(`/subjects/${savedId}`);
}

export async function deleteSubject(_previous: SubjectFormState, formData: FormData): Promise<SubjectFormState> {
  const user = await requireUser();
  const id = formData.get("subjectId");
  if ((typeof id !== "string" || !subjectIdSchema.safeParse(id).success)) return { error: "Subject not found or unavailable." };
  if (formData.get("confirm") !== "yes") return { error: "Confirm deletion before continuing." };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("subjects").delete().eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
    if (error) return { error: "We couldn’t delete this subject. Please try again." };
    if (!data) return { error: "Subject not found or unavailable." };
  } catch {
    return { error: "We couldn’t delete this subject. Please try again." };
  }
  refreshSubjects(id);
  redirect("/subjects");
}
