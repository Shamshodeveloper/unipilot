import { z } from "zod";

export const subjectIdSchema = z.uuid();
export const subjectSchema = z.object({
  name: z.string().trim().min(1, "Enter a subject name.").max(200, "Use at most 200 characters."),
  description: z.string().trim().max(5000, "Use at most 5,000 characters.").transform((value) => value || null),
  instructor: z.string().trim().max(200, "Use at most 200 characters.").transform((value) => value || null),
});
export type SubjectFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "description" | "instructor", string[]>>;
  values?: { name: string; description: string; instructor: string };
};
