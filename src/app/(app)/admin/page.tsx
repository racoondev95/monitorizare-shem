import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { listRecentActivity, listUserSummaries } from "@/lib/queries";

export const metadata: Metadata = { title: "Administrare" };

function when(iso: string | Date | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ro-RO", {
    timeZone: process.env.APP_TIMEZONE || "Europe/Bucharest",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPage() {
  await requireAdmin();
  const [users, activity] = await Promise.all([listUserSummaries(), listRecentActivity(15)]);

  const totalEvocations = users.reduce((s, u) => s + u.evocations, 0);
  const totalDays = users.reduce((s, u) => s + u.filled_days, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">Administrare</h1>
          <p className="text-muted">Activitatea tuturor utilizatorilor.</p>
        </div>
        <a href="/api/export" download className="btn btn-primary w-full sm:w-auto">
          ⬇ Export CSV (toți)
        </a>
      </div>

      <section className="grid grid-cols-3 gap-3" aria-label="Statistici">
        <Stat label="Utilizatori" value={users.length} />
        <Stat label="Evocări" value={totalEvocations} />
        <Stat label="Zile notate" value={totalDays} />
      </section>

      <section className="space-y-3">
        <h2 className="h2">Utilizatori</h2>
        <ul className="space-y-3">
          {users.map((u) => (
            <li key={u.id}>
              <Link
                href={`/admin/users/${u.id}`}
                className="block rounded-xl border border-border bg-surface p-4 transition hover:border-primary hover:shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {u.name}
                      {u.role === "admin" && <span className="badge ml-2">admin</span>}
                    </p>
                    <p className="truncate text-sm text-muted">{u.email}</p>
                  </div>
                  <p className="text-xs text-muted">Ultima activitate: {when(u.last_activity)}</p>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                  <Mini label="Evocări" value={u.evocations} />
                  <Mini label="Îngeri" value={`${u.distinct_angels}/72`} />
                  <Mini label="Zile notate" value={u.filled_days} />
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="h2">Activitate recentă</h2>
        {activity.length === 0 ? (
          <p className="text-muted">Nicio activitate încă.</p>
        ) : (
          <ul className="card divide-y divide-border !p-0">
            {activity.map((a, i) => (
              <li key={i}>
                <Link
                  href={`/evocations/${a.evocation_id}${a.day_number ? `?day=${a.day_number}` : ""}`}
                  className="flex flex-wrap items-center justify-between gap-1 px-4 py-3 text-sm hover:bg-surface-2"
                >
                  <span>
                    <strong>{a.user_name}</strong>{" "}
                    {a.kind === "evocation"
                      ? "a evocat"
                      : `a notat ziua ${a.day_number} cu`}{" "}
                    <span className="font-display font-semibold">{a.angel_name}</span>
                  </span>
                  <span className="text-xs text-muted">{when(a.at)}</span>
                </Link>
              </li>
            ))}
          </ul>
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

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-surface-2 py-2">
      <dd className="font-semibold">{value}</dd>
      <dt className="text-xs text-muted">{label}</dt>
    </div>
  );
}
