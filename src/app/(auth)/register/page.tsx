import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Cont nou" };

export default function RegisterPage() {
  return (
    <>
      <h2 className="h2 mb-4">Cont nou</h2>
      <RegisterForm />
      <p className="mt-5 text-center text-sm text-muted">
        Ai deja cont?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Autentifică-te
        </Link>
      </p>
    </>
  );
}
