import type { Metadata } from "next";
import { LoginPage } from "@/components/auth/LoginPage";

export const metadata: Metadata = { title: "Sign in — Portail RH Lesaffre" };

export default function LoginRoute() {
  return <LoginPage />;
}
