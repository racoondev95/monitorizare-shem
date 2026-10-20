"use client";

import { useActionState } from "react";
import { saveDaily, type FormState } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

const LEVELS = [
  { key: "physical", label: "Fizic", hint: "Corp, energie, somn, apetit…", color: "var(--physical)" },
  { key: "emotional", label: "Emoțional", hint: "Stări, emoții, reacții…", color: "var(--emotional)" },
  { key: "mental", label: "Mental", hint: "Gânduri, claritate, idei…", color: "var(--mental)" },
  { key: "spiritual", label: "Spiritual", hint: "Intuiții, vise, conexiune…", color: "var(--spiritual)" },
] as const;

type Values = { physical: string; emotional: string; mental: string; spiritual: string };

export function DailyForm({
  evocationId,
  day,
  values,
  readOnly,
}: {
  evocationId: number;
  day: number;
  values: Values;
  readOnly: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveDaily, {});

  return (
    // key = ziua, ca formularul să se reseteze la schimbarea zilei
    <form key={day} action={action} className="space-y-4">
      <input type="hidden" name="evocation_id" value={evocationId} />
      <input type="hidden" name="day_number" value={day} />
      {state.error && <p role="alert" className="alert-error">{state.error}</p>}
      {state.ok && <p role="status" className="alert-ok">Salvat.</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {LEVELS.map((l) => (
          <div key={l.key} className="rounded-xl border border-border p-3" style={{ borderLeft: `4px solid ${l.color}` }}>
            <label className="label" htmlFor={`${l.key}-${day}`} style={{ color: l.color }}>
              {l.label}
            </label>
            <textarea
              id={`${l.key}-${day}`}
              name={l.key}
              defaultValue={values[l.key]}
              readOnly={readOnly}
              maxLength={10000}
              placeholder={readOnly ? "—" : l.hint}
              className="input"
            />
          </div>
        ))}
      </div>

      {!readOnly && (
        <SubmitButton className="btn btn-primary w-full sm:w-auto">Salvează ziua {day}</SubmitButton>
      )}
    </form>
  );
}
