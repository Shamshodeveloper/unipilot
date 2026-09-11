import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/server/site-url";
import { matchesFileSignature, MAX_MATERIAL_BYTES, validateMaterialFile } from "@/lib/validation/materials";
import { removeMaterial, uploadMaterial } from "@/server/materials";

const reply = (error: string | null, status = 200) => Response.json(error ? { error } : { success: true }, { status, headers: { "Cache-Control": "private, no-store" } });
const BODY_LIMIT = MAX_MATERIAL_BYTES + 1024 * 1024;

async function handle(request: Request, context: { params: Promise<{ id: string }> }) {
  if (request.headers.get("origin") !== getSiteUrl()) return reply("Invalid request origin.", 403);
  const user = await getCurrentUser();
  if (!user) return reply("Sign in to manage materials.", 401);
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return reply("Subject not found.", 404);
  const supabase = await createClient();
  const subject = await supabase.from("subjects").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (subject.error) return reply("We couldn’t verify the subject. Please try again.", 503);
  if (!subject.data) return reply("Subject not found.", 404);
  let error: string | null;
  if (request.method === "DELETE") {
    const materialId = new URL(request.url).searchParams.get("materialId");
    if (!z.uuid().safeParse(materialId).success) return reply("Invalid material.", 400);
    error = await removeMaterial(supabase, user.id, id, materialId!);
  } else {
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) return reply("Choose a file to upload.", 400);
    if (Number(request.headers.get("content-length")) > BODY_LIMIT) return reply("Files must be 20 MB or smaller.", 413);
    if (!request.body) return reply("Choose a file to upload.", 400);
    // Bound actual bytes too; Content-Length alone is untrusted and may be absent.
    const reader = request.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > BODY_LIMIT) { await reader.cancel(); return reply("Files must be 20 MB or smaller.", 413); }
      chunks.push(new Uint8Array(part.value));
    }
    let form: FormData;
    try { form = await new Response(new Blob(chunks), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData(); }
    catch { return reply("The upload could not be read. Please choose the file again.", 400); }
    const file = form.get("file");
    if (!(file instanceof File) || form.getAll("file").length !== 1) return reply("Choose one file at a time.", 400);
    const invalid = validateMaterialFile(file);
    if (invalid) return reply(invalid, 400);
    if (!await matchesFileSignature(file)) return reply("File contents do not match its declared type.", 400);
    error = await uploadMaterial(supabase, user.id, id, file);
  }
  revalidatePath(`/subjects/${id}`);
  revalidatePath("/dashboard");
  return reply(error, error ? 400 : 200);
}
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return await handle(request, context); } catch { return reply("The operation could not be confirmed. Refresh the material list before retrying.", 503); }
}
export const DELETE = POST;
