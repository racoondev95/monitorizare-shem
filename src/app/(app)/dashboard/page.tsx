import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDailyEntries, listEvocations } from "@/lib/queries";
import { dayOfEvocation } from "@/lib/dates";
import { EvocationCard } from "@/components/EvocationCard";

export const metadata: Metadata = { title: "Acasă" };

export default async function Dashboard() {
  const user = await requireUser();
  const evocations = await listEvocations(user.id);

  const distinct = new Set(evocations.map((e) => e.angel_id)).size;
  const totalDays = evocations.reduce((s, e) => s + e.filled_days, 0);
  const active = evocations.filter((e) => {
    const d = dayOfEvocation(e.evoked_on);
    return d >= 1 && d <= 7;
  });

  // pentru fiecare evocare activă, verificăm dacă ziua de azi e completată
  const todayStatus = await Promise.all(
    active.map(async (e) => {
      const day = dayOfEvocation(e.evoked_on);
      const entries = await getDailyEntries(e.id);
      const entry = entries.find((x) => x.day_number === day);
      const done = !!entry && (entry.physical || entry.emotional || entry.mental || entry.spiritual) !== "";
      return { e, day, done };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">Bună, {user.name.split(" ")[0]}</h1>
          <p className="text-muted">Iată cum arată drumul tău cu cei 72 de îngeri.</p>
        </div>
        <Link href="/evocations/new" className="btn btn-primary w-full sm:w-auto">
          + Evocare nouă
        </Link>
      </div>

      <section className="grid grid-cols-3 gap-3" aria-label="Statistici">
        <Stat label="Evocări" value={evocations.length} />
        <Stat label="Îngeri evocați" value={`${distinct}/72`} />
        <Stat label="Zile notate" value={totalDays} />
      </section>

      <section className="card">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Progres către toți cei 72</span>
          <span className="text-muted">{Math.round((distinct / 72) * 100)}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-gold" style={{ width: `${(distinct / 72) * 100}%` }} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="h2">Azi</h2>
        {todayStatus.length === 0 ? (
          <div className="card text-center">
            <p className="text-muted">Nu ai nicio evocare activă în această săptămână.</p>
            <Link href="/angels" className="btn btn-ghost mt-3">
              Alege un înger
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {todayStatus.map(({ e, day, done }) => (
              <li key={e.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold">
                    #{e.angel_id} {e.angel_name}
                  </p>
                  <p className="text-sm text-muted">
                    Ziua {day} din 7 · {done ? "completată ✓" : "încă necompletată"}
                  </p>
                </div>
                <Link
                  href={`/evocations/${e.id}?day=${day}`}
                  className={`btn w-full sm:w-auto ${done ? "btn-ghost" : "btn-primary"}`}
                >
                  {done ? "Vezi / editează" : `Completează ziua ${day}`}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="h2">Evocări recente</h2>
          {evocations.length > 0 && (
            <div className="flex gap-2">
              <a href="/api/export" className="btn btn-ghost min-h-9 px-3" download>
                ⬇ Export CSV
              </a>
              <Link href="/evocations" className="btn btn-ghost min-h-9 px-3">
                Toate
              </Link>
            </div>
          )}
        </div>
        {evocations.length === 0 ? (
          <p className="text-muted">Nicio evocare încă. Începe prin a alege un înger din listă.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {evocations.slice(0, 4).map((e) => (
              <EvocationCard key={e.id} e={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 text-center sm:p-4">
      <div className="font-display text-2xl font-semibold text-primary sm:text-3xl">{value}</div>
      <div className="text-xs text-muted sm:text-sm">{label}</div>
    </div>
  );
}
