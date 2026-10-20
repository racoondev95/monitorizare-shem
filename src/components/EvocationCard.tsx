import Link from "next/link";
import { dayOfEvocation, formatDate } from "@/lib/dates";
import type { Evocation } from "@/lib/queries";

export function EvocationCard({ e, showUser }: { e: Evocation & { user_name?: string }; showUser?: boolean }) {
  const day = dayOfEvocation(e.evoked_on);
  const status = day >= 1 && day <= 7 ? `Ziua ${day} din 7` : "Încheiată";

  return (
    <Link
      href={`/evocations/${e.id}`}
      className="block rounded-xl border border-border bg-surface p-4 transition hover:border-primary hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold">
            <span className="text-muted">#{e.angel_id}</span> {e.angel_name}
          </p>
          <p className="text-sm text-muted">
            {formatDate(e.evoked_on)}
            {showUser && e.user_name ? ` · ${e.user_name}` : ""}
          </p>
        </div>
        <span className={`badge shrink-0 ${day >= 1 && day <= 7 ? "" : "!bg-surface-2 !text-muted"}`}>{status}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={7}
          aria-valuenow={e.filled_days}
          aria-label="Zile completate"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${(e.filled_days / 7) * 100}%` }} />
        </div>
        <span className="text-xs text-muted">{e.filled_days}/7 zile</span>
      </div>
    </Link>
  );
}
