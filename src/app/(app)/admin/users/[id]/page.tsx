import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getUserById, listEvocations } from "@/lib/queries";
import { EvocationCard } from "@/components/EvocationCard";

export const metadata: Metadata = { title: "Utilizator" };

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) notFound();

  const user = await getUserById(id);
  if (!user) notFound();
  const evocations = await listEvocations(id);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin" className="text-sm text-muted hover:underline">
          ← Administrare
        </Link>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="h1">{user.name}</h1>
            <p className="text-muted">{user.email}</p>
          </div>
          <a href={`/api/export?user=${user.id}`} download className="btn btn-primary w-full sm:w-auto">
            ⬇ Export CSV
          </a>
        </div>
      </div>

      {evocations.length === 0 ? (
        <div className="card text-center text-muted">Acest utilizator nu are evocări.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {evocations.map((e) => (
            <EvocationCard key={e.id} e={e} />
          ))}
        </div>
      )}
    </div>
  );
}
