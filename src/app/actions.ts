"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  clearFailures,
  createSession,
  destroySession,
  isRateLimited,
  recordFailure,
  requireUser,
} from "@/lib/auth";
import { addDays, isValidDate, today } from "@/lib/dates";

export type FormState = { error?: string; ok?: boolean; savedAt?: number };

const MAX_TEXT = 10_000;
// hash fals, pentru a egaliza timpul de răspuns când emailul nu există
const DUMMY_HASH = bcrypt.hashSync("parola-fictiva", 12);

function str(formData: FormData, key: string, max = MAX_TEXT): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

// ---------------------------------------------------------------- auth

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, "email", 200).toLowerCase();
  const password = typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";
  if (!email || !password) return { error: "Introdu emailul și parola." };

  if (isRateLimited(email)) {
    return { error: "Prea multe încercări eșuate. Încearcă din nou peste 15 minute." };
  }

  const pool = await db();
  const { rows } = await pool.query<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = $1",
    [email],
  );
  const user = rows[0];
  const valid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) {
    recordFailure(email);
    return { error: "Email sau parolă incorectă." };
  }

  clearFailures(email);
  await createSession(user.id);
  redirect("/dashboard");
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  if (process.env.ALLOW_REGISTRATION === "false") {
    return { error: "Înregistrarea este dezactivată." };
  }
  const name = str(formData, "name", 100);
  const email = str(formData, "email", 200).toLowerCase();
  const password = (formData.get("password") as string) ?? "";
  const confirm = (formData.get("confirm") as string) ?? "";

  if (!name) return { error: "Introdu numele." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Adresa de email nu este validă." };
  if (password.length < 8) return { error: "Parola trebuie să aibă minim 8 caractere." };
  if (password.length > 200) return { error: "Parola este prea lungă." };
  if (password !== confirm) return { error: "Parolele nu coincid." };

  const pool = await db();
  const hash = await bcrypt.hash(password, 12);
  let userId: number;
  try {
    const { rows } = await pool.query<{ id: number }>(
      "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [email, name, hash],
    );
    userId = rows[0].id;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return { error: "Există deja un cont cu acest email." };
    }
    throw err;
  }

  await createSession(userId);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

// ----------------------------------------------------------- evocations

export async function createEvocation(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const angelId = Number(formData.get("angel_id"));
  const evokedOn = str(formData, "evoked_on", 10);
  const message = str(formData, "message");
  const sensation = str(formData, "sensation");

  if (!Number.isInteger(angelId) || angelId < 1 || angelId > 72) return { error: "Alege un înger din listă." };
  if (!isValidDate(evokedOn)) return { error: "Data evocării nu este validă." };
  if (evokedOn > today()) return { error: "Data evocării nu poate fi în viitor." };

  const pool = await db();
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO evocations (user_id, angel_id, evoked_on, message, sensation)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [user.id, angelId, evokedOn, message, sensation],
  );
  redirect(`/evocations/${rows[0].id}`);
}

export async function updateEvocation(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const angelId = Number(formData.get("angel_id"));
  const evokedOn = str(formData, "evoked_on", 10);
  const message = str(formData, "message");
  const sensation = str(formData, "sensation");

  if (!Number.isInteger(id)) return { error: "Evocare invalidă." };
  if (!Number.isInteger(angelId) || angelId < 1 || angelId > 72) return { error: "Alege un înger din listă." };
  if (!isValidDate(evokedOn)) return { error: "Data evocării nu este validă." };
  if (evokedOn > today()) return { error: "Data evocării nu poate fi în viitor." };

  const pool = await db();
  const res = await pool.query(
    `UPDATE evocations
        SET angel_id = $3, evoked_on = $4, message = $5, sensation = $6, updated_at = now()
      WHERE id = $1 AND user_id = $2`,
    [id, user.id, angelId, evokedOn, message, sensation],
  );
  if (res.rowCount === 0) return { error: "Evocarea nu a fost găsită." };

  revalidatePath(`/evocations/${id}`);
  return { ok: true, savedAt: Date.now() };
}

export async function deleteEvocation(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id)) {
    const pool = await db();
    await pool.query("DELETE FROM evocations WHERE id = $1 AND user_id = $2", [id, user.id]);
  }
  redirect("/evocations");
}

// -------------------------------------------------------- daily entries

export async function saveDaily(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const evocationId = Number(formData.get("evocation_id"));
  const day = Number(formData.get("day_number"));
  if (!Number.isInteger(evocationId) || !Number.isInteger(day) || day < 1 || day > 7) {
    return { error: "Date invalide." };
  }

  const pool = await db();
  const { rows } = await pool.query<{ evoked_on: string }>(
    "SELECT evoked_on FROM evocations WHERE id = $1 AND user_id = $2",
    [evocationId, user.id],
  );
  if (!rows[0]) return { error: "Evocarea nu a fost găsită." };
  if (addDays(rows[0].evoked_on, day - 1) > today()) {
    return { error: "Nu poți completa o zi care nu a venit încă." };
  }

  await pool.query(
    `INSERT INTO daily_entries (evocation_id, day_number, physical, emotional, mental, spiritual)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (evocation_id, day_number) DO UPDATE
       SET physical = EXCLUDED.physical, emotional = EXCLUDED.emotional,
           mental = EXCLUDED.mental, spiritual = EXCLUDED.spiritual, updated_at = now()`,
    [
      evocationId,
      day,
      str(formData, "physical"),
      str(formData, "emotional"),
      str(formData, "mental"),
      str(formData, "spiritual"),
    ],
  );

  revalidatePath(`/evocations/${evocationId}`);
  return { ok: true, savedAt: Date.now() };
}
