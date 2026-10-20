import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/actions";
import { Nav } from "@/components/Nav";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh pb-24 md:pb-10">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-display text-lg font-semibold">
            <span aria-hidden className="text-gold">✦</span> Shem
          </Link>
          <div className="flex-1">
            <Nav isAdmin={user.role === "admin"} />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-40 truncate text-sm text-muted sm:inline" title={user.email}>
              {user.name}
              {user.role === "admin" && <span className="badge ml-2">admin</span>}
            </span>
            <form action={logout}>
              <button type="submit" className="btn btn-ghost min-h-9 px-3">
                Ieșire
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
