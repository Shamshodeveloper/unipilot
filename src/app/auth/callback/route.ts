import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/server/site-url";

export async function GET(request: NextRequest) {
  const siteUrl = getSiteUrl();
  const code = request.nextUrl.searchParams.get("code");
  if (code && code.length <= 2048) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const response = NextResponse.redirect(new URL("/dashboard", siteUrl));
        response.headers.set("Cache-Control", "private, no-store");
        return response;
      }
    } catch {
      // Never render provider errors or the confirmation code into the page.
    }
  }
  const response = NextResponse.redirect(new URL("/login?confirmation=failed", siteUrl));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
