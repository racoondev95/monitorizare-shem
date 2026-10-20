import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { listAngels, listEvocations } from "@/lib/queries";
import { addDays, today, diffDays, formatDate } from "@/lib/dates";
import { EvocationForm } from "@/components/EvocationForm";

export const metadata: Metadata = { title: "Evocare nouă" };

export default async function NewEvocationPage({
  searchParams,
}: {
  searchParams: Promise<{ angel?: string }>;
}) {
  const user = await requireUser();
  const { angel } = await searchParams;
  const [angels, evocations] = await Promise.all([listAngels(), listEvocations(user.id)]);

  const t = today();
  const preselected = Number(angel);
  const initial = angels.some((a) => a.id === preselected)
    ? { angel_id: preselected, evoked_on: t, message: "", sensation: "" }
    : undefined;

  // evocarea se face o dată pe săptămână: avertizăm dacă una e încă în desfășurare
  const recent = evocations.find((e) => diffDays(t, e.evoked_on) < 7);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/evocations" className="text-sm text-muted hover:underline">
          ← Evocările mele
        </Link>
        <h1 className="h1 mt-1">Evocare nouă</h1>
      </div>

      {recent && (
        <p className="rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-2.5 text-sm">
          Ai deja o evocare în ultimele 7 zile ({recent.angel_name}, ziua{" "}
          {diffDays(t, recent.evoked_on) + 1} din 7). Evocarea se face o dată pe săptămână, începând cu{" "}
          {formatDate(addDays(recent.evoked_on, 7))}.
        </p>
      )}

      <div className="card">
        <EvocationForm angels={angels} today={t} initial={initial} />
      </div>
    </div>
  );
}
