"use client";

import { useActionState } from "react";
import { createEvocation, updateEvocation, type FormState } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

type Angel = { id: number; name: string };

export function EvocationForm({
  angels,
  today,
  initial,
  evocationId,
}: {
  angels: Angel[];
  today: string;
  initial?: { angel_id: number; evoked_on: string; message: string; sensation: string };
  evocationId?: number;
}) {
  const editing = evocationId !== undefined;
  const [state, action] = useActionState<FormState, FormData>(
    editing ? updateEvocation : createEvocation,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      {editing && <input type="hidden" name="id" value={evocationId} />}
      {state.error && <p role="alert" className="alert-error">{state.error}</p>}
      {state.ok && <p role="status" className="alert-ok">Evocarea a fost salvată.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="angel_id">Numele îngerului</label>
          <select
            id="angel_id"
            name="angel_id"
            required
            defaultValue={initial?.angel_id ?? ""}
            className="input"
          >
            <option value="" disabled>Alege un înger…</option>
            {angels.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id}. {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="evoked_on">Data evocării</label>
          <input
            id="evoked_on"
            name="evoked_on"
            type="date"
            required
            max={today}
            defaultValue={initial?.evoked_on ?? today}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="message">Mesaj primit</label>
        <textarea
          id="message"
          name="message"
          maxLength={10000}
          defaultValue={initial?.message ?? ""}
          placeholder="Ce mesaj ai primit de la înger?"
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="sensation">Senzație</label>
        <textarea
          id="sensation"
          name="sensation"
          maxLength={10000}
          defaultValue={initial?.sensation ?? ""}
          placeholder="Ce ai simțit în timpul evocării?"
          className="input"
        />
      </div>

      <SubmitButton className="btn btn-primary w-full sm:w-auto">
        {editing ? "Salvează modificările" : "Salvează evocarea"}
      </SubmitButton>
    </form>
  );
}
