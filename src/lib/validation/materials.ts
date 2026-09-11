import { z } from "zod";
export const MATERIAL_BUCKET = "academic-materials";
export const MAX_MATERIAL_BYTES = 20 * 1024 * 1024;
export const materialFileSchema = z.object({
  name: z.string().min(1).max(255).refine((name) => name.trim().length > 0 && !/[\\/\x00-\x1f\x7f]/.test(name), "Use a plain filename without path separators."),
  type: z.enum(["application/pdf", "image/png", "image/jpeg", "image/webp"]),
  size: z.number().int().positive().max(MAX_MATERIAL_BYTES),
}).refine(({ name, type }) => {
  const extension = name.split(".").at(-1)?.toLowerCase();
  return ({ "application/pdf": ["pdf"], "image/png": ["png"], "image/jpeg": ["jpg", "jpeg"], "image/webp": ["webp"] })[type].includes(extension ?? "");
}, "Filename extension must match the file type.");

export function validateMaterialFile(file: { name: string; type: string; size: number }) {
  if (file.size > MAX_MATERIAL_BYTES) return "Files must be 20 MB or smaller.";
  if (!file.size) return "Choose a file that is not empty.";
  return materialFileSchema.safeParse(file).success ? null : "Choose a PDF, PNG, JPG/JPEG, or WEBP with a matching file type and a valid filename (up to 255 characters).";
}

export async function matchesFileSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const begins = (expected: number[]) => expected.every((byte, index) => bytes[index] === byte);
  switch (file.type) {
    case "application/pdf": return begins([37, 80, 68, 70, 45]);
    case "image/png": return begins([137, 80, 78, 71, 13, 10, 26, 10]);
    case "image/jpeg": return begins([255, 216, 255]);
    case "image/webp": return begins([82, 73, 70, 70]) && [87, 69, 66, 80].every((byte, index) => bytes[index + 8] === byte);
    default: return false;
  }
}
