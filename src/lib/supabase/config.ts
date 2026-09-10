import { z } from "zod";

const configSchema = z.object({
  url: z.url().refine((value) => {
    const url = new URL(value);
    return !url.username && !url.password &&
      (url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)));
  }),
  key: z.string().trim().startsWith("sb_publishable_").min(20),
});

export function getSupabaseConfig() {
  const result = configSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return result.success ? result.data : null;
}

export function requireSupabaseConfig() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Configure the public Supabase URL and publishable key in .env.local.");
  return config;
}
