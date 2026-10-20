import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { listAngels, listEvocations } from "@/lib/queries";
import { AngelGrid } from "@/components/AngelGrid";

export const metadata: Metadata = { title: "Îngeri" };

export default async function AngelsPage() {
  const user = await requireUser();
  const [angels, evocations] = await Promise.all([listAngels(), listEvocations(user.id)]);

  const counts = new Map<number, number>();
  for (const e of evocations) counts.set(e.angel_id, (counts.get(e.angel_id) ?? 0) + 1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h1">Cei 72 de îngeri</h1>
        <p className="text-muted">Alege un înger pentru a înregistra o evocare nouă.</p>
      </div>
      <AngelGrid angels={angels.map((a) => ({ ...a, count: counts.get(a.id) ?? 0 }))} />
    </div>
  );
}
