import type { Metadata } from "next";
import { AuthPreview } from "@/components/auth/auth-preview";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return <AuthPreview mode="login" />;
}
