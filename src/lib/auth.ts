import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

const COOKIE = "shem_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 zile

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: "user" | "admin";
};

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET lipsește sau este prea scurt");
  return new TextEncoder().encode(s);
}

export async function createSession(userId: number) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Utilizatorul curent (verificat și în DB), sau null. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const uid = Number(payload.uid);
    if (!Number.isInteger(uid)) return null;
    const pool = await db();
    const { rows } = await pool.query<SessionUser>(
      "SELECT id, email, name, role FROM users WHERE id = $1",
      [uid],
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

// --- limitare simplă a încercărilor de autentificare (în memorie) ---
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function isRateLimited(key: string): boolean {
  const a = attempts.get(key);
  if (!a) return false;
  if (Date.now() - a.first > WINDOW) {
    attempts.delete(key);
    return false;
  }
  return a.count >= MAX_ATTEMPTS;
}

export function recordFailure(key: string) {
  const a = attempts.get(key);
  if (!a || Date.now() - a.first > WINDOW) attempts.set(key, { count: 1, first: Date.now() });
  else a.count++;
}

export function clearFailures(key: string) {
  attempts.delete(key);
}
