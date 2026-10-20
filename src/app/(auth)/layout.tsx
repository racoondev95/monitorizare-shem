import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getUser()) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div aria-hidden className="mb-2 text-4xl text-gold">✦</div>
          <h1 className="h1">Shem</h1>
          <p className="mt-1 text-sm text-muted">Jurnalul evocărilor celor 72 de îngeri</p>
        </div>
        <div className="card">{children}</div>
      </div>
    </main>
  );
}
