"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Item = { id: number; name: string; count: number };

export function AngelGrid({ angels }: { angels: Item[] }) {
  const [q, setQ] = useState("");
  const [onlyNew, setOnlyNew] = useState(false);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return angels.filter(
      (a) => (!t || a.name.toLowerCase().includes(t) || String(a.id) === t) && (!onlyNew || a.count === 0),
    );
  }, [angels, q, onlyNew]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Caută după nume sau număr…"
          aria-label="Caută înger"
          className="input sm:max-w-xs"
        />
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyNew}
            onChange={(e) => setOnlyNew(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Doar cei neevocați încă
        </label>
      </div>

      {list.length === 0 ? (
        <p className="py-8 text-center text-muted">Niciun înger găsit.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
          {list.map((a) => (
            <li key={a.id}>
              <Link
                href={`/evocations/new?angel=${a.id}`}
                className={`flex min-h-20 flex-col justify-between rounded-xl border p-3 transition hover:border-primary hover:shadow-sm ${
                  a.count > 0 ? "border-primary/40 bg-primary-soft" : "border-border bg-surface"
                }`}
              >
                <span className="text-xs text-muted">#{a.id}</span>
                <span className="break-words font-display text-base font-semibold">{a.name}</span>
                <span className={`text-xs ${a.count > 0 ? "text-primary" : "text-muted"}`}>
                  {a.count > 0 ? `✓ evocat de ${a.count}×` : "neevocat"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
