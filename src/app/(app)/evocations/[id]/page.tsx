import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDailyEntries, getEvocation, getUserById, listAngels } from "@/lib/queries";
import { addDays, dayOfEvocation, formatDate, today } from "@/lib/dates";
import { deleteEvocation } from "@/app/actions";
import { EvocationForm } from "@/components/EvocationForm";
import { DailyForm } from "@/components/DailyForm";
import { ConfirmForm } from "@/components/ConfirmForm";

export const metadata: Metadata = { title: "Evocare" };

const empty = { physical: "", emotional: "", mental: "", spiritual: "" };

export default async function EvocationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const user = await requireUser();
  const { id: rawId } = await params;
  const { day: rawDay } = await searchParams;

  const id = Number(rawId);
  if (!Number.isInteger(id)) notFound();
  const evocation = await getEvocation(id);
  if (!evocation) notFound();

  const isOwner = evocation.user_id === user.id;
  if (!isOwner && user.role !== "admin") notFound();

  const [entries, angels, owner] = await Promise.all([
    getDailyEntries(id),
    isOwner ? listAngels() : Promise.resolve([]),
    isOwner ? Promise.resolve(null) : getUserById(evocation.user_id),
  ]);

  const t = today();
  const current = dayOfEvocation(evocation.evoked_on, t);
  const defaultDay = current >= 1 && current <= 7 ? current : 1;
  const requested = Number(rawDay);
  const day = Number.isInteger(requested) && requested >= 1 && requested <= 7 ? requested : defaultDay;

  const byDay = new Map(entries.map((e) => [e.day_number, e]));
  const isFilled = (n: number) => {
    const e = byDay.get(n);
    return !!e && (e.physical || e.emotional || e.mental || e.spiritual) !== "";
  };
  const isFuture = (n: number) => addDays(evocation.evoked_on, n - 1) > t;

  const backHref = isOwner ? "/evocations" : `/admin/users/${evocation.user_id}`;
  const readOnly = !isOwner || isFuture(day);

  return (
    <div className="space-y-6">
      <div>
        <Link href={backHref} className="text-sm text-muted hover:underline">
          ← {isOwner ? "Evocările mele" : `Înapoi la ${owner?.name ?? "utilizator"}`}
        </Link>
        <h1 className="h1 mt-1">
          <span className="text-muted">#{evocation.angel_id}</span> {evocation.angel_name}
        </h1>
        <p className="text-muted">
          Evocat pe {formatDate(evocation.evoked_on)}
          {!isOwner && owner ? ` · ${owner.name} (${owner.email})` : ""}
        </p>
      </div>

      <section className="card space-y-4">
        <h2 className="h2">Cele 7 zile</h2>

        <ol className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="Zilele evocării">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => {
            const future = isFuture(n);
            const selected = n === day;
            const filled = isFilled(n);
            const cls = `flex min-h-14 flex-col items-center justify-center rounded-xl border text-sm transition ${
              selected
                ? "border-primary bg-primary text-[var(--on-primary)]"
                : future
                  ? "border-border bg-surface-2 text-muted opacity-60"
                  : filled
                    ? "border-success/50 bg-success/10 text-text hover:border-primary"
                    : "border-border bg-surface text-text hover:border-primary"
            }`;
            const inner = (
              <>
                <span className="font-semibold">{n}</span>
                <span aria-hidden className="text-[10px] leading-none">
                  {filled ? "✓" : future ? "🔒" : n === current ? "azi" : "·"}
                </span>
              </>
            );
            return (
              <li key={n}>
                {future && !selected ? (
                  <span className={cls} aria-label={`Ziua ${n} (încă nu a venit)`}>{inner}</span>
                ) : (
                  <Link
                    href={`?day=${n}`}
                    scroll={false}
                    className={cls}
                    aria-current={selected ? "step" : undefined}
                    aria-label={`Ziua ${n}${filled ? ", completată" : ""}`}
                  >
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>

        <div>
          <h3 className="font-medium">
            Ziua {day} · {formatDate(addDays(evocation.evoked_on, day - 1), { weekday: "long" })}
            {day === 1 && <span className="badge ml-2">ziua evocării</span>}
          </h3>
          {isFuture(day) && <p className="text-sm text-muted">Această zi nu a venit încă.</p>}
        </div>

        <DailyForm
          evocationId={id}
          day={day}
          values={byDay.get(day) ?? empty}
          readOnly={readOnly}
        />
      </section>

      <section className="card space-y-4">
        <h2 className="h2">Evocarea</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted">Mesaj</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words">{evocation.message || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted">Senzație</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words">{evocation.sensation || "—"}</dd>
          </div>
        </dl>

        {isOwner && (
          <>
            <details className="group rounded-xl border border-border">
              <summary className="min-h-11 cursor-pointer list-none px-4 py-3 text-sm font-medium">
                ✎ Editează evocarea
              </summary>
              <div className="border-t border-border p-4">
                <EvocationForm
                  angels={angels}
                  today={t}
                  evocationId={id}
                  initial={{
                    angel_id: evocation.angel_id,
                    evoked_on: evocation.evoked_on,
                    message: evocation.message,
                    sensation: evocation.sensation,
                  }}
                />
              </div>
            </details>
            <ConfirmForm
              action={deleteEvocation}
              fields={{ id }}
              message="Ștergi această evocare și toate intrările zilnice? Acțiunea nu poate fi anulată."
            >
              Șterge evocarea
            </ConfirmForm>
          </>
        )}
      </section>
    </div>
  );
}
