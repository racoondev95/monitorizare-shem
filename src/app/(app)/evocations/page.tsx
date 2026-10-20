import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { listEvocations } from "@/lib/queries";
import { EvocationCard } from "@/components/EvocationCard";

export const metadata: Metadata = { title: "Evocările mele" };

export default async function EvocationsPage() {
  const user = await requireUser();
  const evocations = await listEvocations(user.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">Evocările mele</h1>
          <p className="text-muted">{evocations.length} înregistrări</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          {evocations.length > 0 && (
            <a href="/api/export" download className="btn btn-ghost flex-1 sm:flex-none">
              ⬇ Export CSV
            </a>
          )}
          <Link href="/evocations/new" className="btn btn-primary flex-1 sm:flex-none">
            + Evocare nouă
          </Link>
        </div>
      </div>

      {evocations.length === 0 ? (
        <div className="card text-center text-muted">Nicio evocare încă.</div>
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
