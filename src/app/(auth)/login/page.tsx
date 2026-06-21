import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Battery Inventory Management",
  description: "Sign in to your Battery Inventory Management account",
};

export default function LoginPage() {
  return <LoginForm />;
}
