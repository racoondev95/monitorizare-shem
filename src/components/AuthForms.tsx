"use client";

import { useActionState } from "react";
import { login, register, type FormState } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

const initial: FormState = {};

export function LoginForm() {
  const [state, action] = useActionState(login, initial);
  return (
    <form action={action} className="space-y-4">
      {state.error && <p role="alert" className="alert-error">{state.error}</p>}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">Parolă</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <SubmitButton className="btn btn-primary w-full" pendingText="Se verifică…">
        Intră în cont
      </SubmitButton>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(register, initial);
  return (
    <form action={action} className="space-y-4">
      {state.error && <p role="alert" className="alert-error">{state.error}</p>}
      <div>
        <label className="label" htmlFor="name">Nume</label>
        <input id="name" name="name" autoComplete="name" required maxLength={100} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">Parolă (minim 8 caractere)</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="confirm">Confirmă parola</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} className="input" />
      </div>
      <SubmitButton className="btn btn-primary w-full" pendingText="Se creează contul…">
        Creează cont
      </SubmitButton>
    </form>
  );
}
