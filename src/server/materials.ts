import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth";
import { MATERIAL_BUCKET } from "@/lib/validation/materials";

export async function listMaterials(subjectId: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const materials = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("materials").select("id, file_name, mime_type, size_bytes, created_at")
      .eq("user_id", user.id).eq("subject_id", subjectId).order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
    if (error) return null;
    materials.push(...data);
    if (data.length < 500) return materials;
  }
}

export async function uploadMaterial(supabase: SupabaseClient<Database>, userId: string, subjectId: string, file: File) {
  const id = crypto.randomUUID();
  const path = `${userId}/${subjectId}/${id}.${file.name.split(".").at(-1)!.toLowerCase()}`;
  // Reserve metadata first so an uncertain Storage failure remains discoverable and deletable.
  const { error: metadataError } = await supabase.from("materials").insert({ id, user_id: userId, subject_id: subjectId, file_name: file.name, mime_type: file.type, size_bytes: file.size, storage_path: path });
  if (metadataError) return "We couldn’t save the material metadata. Please try again.";
  const uploaded = await supabase.storage.from(MATERIAL_BUCKET).upload(path, file, { contentType: file.type, upsert: false }).catch(() => ({ error: true }));
  if (!uploaded.error) {
    const { data, error } = await supabase.from("materials").select("id").eq("id", id).eq("user_id", userId).maybeSingle();
    if (!error && data) return null;
  }
  const cleanup = await supabase.storage.from(MATERIAL_BUCKET).remove([path]).catch(() => ({ error: true }));
  if (cleanup.error) return "Upload could not be confirmed. Its record was kept; delete it from the list to retry cleanup before uploading again.";
  const { error } = await supabase.from("materials").delete().eq("id", id).eq("user_id", userId);
  return error ? "Upload failed. Its record was kept; delete it from the list before trying again." : "Upload failed. Please try again.";
}

export async function removeMaterial(supabase: SupabaseClient<Database>, userId: string, subjectId: string, materialId: string) {
  const { data, error } = await supabase.from("materials").select("id, storage_path").eq("id", materialId).eq("user_id", userId).eq("subject_id", subjectId).maybeSingle();
  if (error) return "We couldn’t load this material. Please try again.";
  if (!data) return "Material not found or unavailable.";
  if (data.storage_path) {
    if (!data.storage_path.startsWith(`${userId}/${subjectId}/`)) return "This material has an invalid storage path. It was not deleted.";
    const result = await supabase.storage.from(MATERIAL_BUCKET).remove([data.storage_path]);
    if (result.error) return "We couldn’t remove the file. Its metadata was kept; please retry deletion.";
  }
  // Storage deletion is idempotent: a missing object is safe to retry after a metadata failure.
  const result = await supabase.from("materials").delete().eq("id", materialId).eq("user_id", userId).eq("subject_id", subjectId);
  return result.error ? "File removed, but its metadata could not be deleted. Please retry deletion." : null;
}
