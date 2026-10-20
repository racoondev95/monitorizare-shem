import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Autentificare" };

export default function LoginPage() {
  return (
    <>
      <h2 className="h2 mb-4">Autentificare</h2>
      <LoginForm />
      {process.env.ALLOW_REGISTRATION !== "false" && (
        <p className="mt-5 text-center text-sm text-muted">
          Nu ai cont?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Creează unul
          </Link>
        </p>
      )}
    </>
  );
}
