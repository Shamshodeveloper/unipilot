import type { Metadata } from "next";
import { AuthPreview } from "@/components/auth/auth-preview";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return <AuthPreview mode="register" />;
}
