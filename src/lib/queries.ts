import "server-only";
import { db } from "./db";

export type Angel = { id: number; name: string };

export type Evocation = {
  id: number;
  user_id: number;
  angel_id: number;
  angel_name: string;
  evoked_on: string;
  message: string;
  sensation: string;
  filled_days: number;
};

export type DailyEntry = {
  day_number: number;
  physical: string;
  emotional: string;
  mental: string;
  spiritual: string;
};

export const LEVELS = [
  { key: "physical", label: "Fizic" },
  { key: "emotional", label: "Emoțional" },
  { key: "mental", label: "Mental" },
  { key: "spiritual", label: "Spiritual" },
] as const;

const EVOCATION_SELECT = `
  SELECT e.id, e.user_id, e.angel_id, a.name AS angel_name, e.evoked_on,
         e.message, e.sensation,
         (SELECT count(*)::int FROM daily_entries d
            WHERE d.evocation_id = e.id
              AND (d.physical <> '' OR d.emotional <> '' OR d.mental <> '' OR d.spiritual <> '')
         ) AS filled_days
  FROM evocations e
  JOIN angels a ON a.id = e.angel_id
`;

export async function listAngels(): Promise<Angel[]> {
  const pool = await db();
  const { rows } = await pool.query<Angel>("SELECT id, name FROM angels ORDER BY id");
  return rows;
}

export async function listEvocations(userId: number): Promise<Evocation[]> {
  const pool = await db();
  const { rows } = await pool.query<Evocation>(
    `${EVOCATION_SELECT} WHERE e.user_id = $1 ORDER BY e.evoked_on DESC, e.id DESC`,
    [userId],
  );
  return rows;
}

export async function getEvocation(id: number): Promise<Evocation | null> {
  const pool = await db();
  const { rows } = await pool.query<Evocation>(`${EVOCATION_SELECT} WHERE e.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function getDailyEntries(evocationId: number): Promise<DailyEntry[]> {
  const pool = await db();
  const { rows } = await pool.query<DailyEntry>(
    `SELECT day_number, physical, emotional, mental, spiritual
     FROM daily_entries WHERE evocation_id = $1 ORDER BY day_number`,
    [evocationId],
  );
  return rows;
}

/** Evocările + intrările zilnice pentru export (un user sau toți). */
export type ExportRow = Evocation & {
  user_name: string;
  user_email: string;
  days: Record<number, DailyEntry>;
};

export async function getExportRows(userId?: number): Promise<ExportRow[]> {
  const pool = await db();
  const { rows } = await pool.query<Evocation & { user_name: string; user_email: string }>(
    `SELECT u.name AS user_name, u.email AS user_email,
            e.id, e.user_id, e.angel_id, a.name AS angel_name, e.evoked_on,
            e.message, e.sensation, 0 AS filled_days
     FROM evocations e
     JOIN angels a ON a.id = e.angel_id
     JOIN users u ON u.id = e.user_id
     ${userId ? "WHERE e.user_id = $1" : ""}
     ORDER BY u.name, e.angel_id, e.evoked_on`,
    userId ? [userId] : [],
  );
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const entries = await pool.query<DailyEntry & { evocation_id: number }>(
    `SELECT evocation_id, day_number, physical, emotional, mental, spiritual
     FROM daily_entries WHERE evocation_id = ANY($1::int[])`,
    [ids],
  );
  const byEvocation = new Map<number, Record<number, DailyEntry>>();
  for (const e of entries.rows) {
    const m = byEvocation.get(e.evocation_id) ?? {};
    m[e.day_number] = e;
    byEvocation.set(e.evocation_id, m);
  }
  return rows.map((r) => ({ ...r, days: byEvocation.get(r.id) ?? {} }));
}

export type UserSummary = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
  evocations: number;
  distinct_angels: number;
  filled_days: number;
  last_activity: string | null;
};

export async function listUserSummaries(): Promise<UserSummary[]> {
  const pool = await db();
  const { rows } = await pool.query<UserSummary>(`
    SELECT u.id, u.name, u.email, u.role, u.created_at,
           (SELECT count(*)::int FROM evocations e WHERE e.user_id = u.id) AS evocations,
           (SELECT count(DISTINCT e.angel_id)::int FROM evocations e WHERE e.user_id = u.id) AS distinct_angels,
           (SELECT count(*)::int FROM daily_entries d JOIN evocations e ON e.id = d.evocation_id
              WHERE e.user_id = u.id
                AND (d.physical <> '' OR d.emotional <> '' OR d.mental <> '' OR d.spiritual <> '')) AS filled_days,
           GREATEST(
             (SELECT max(e.updated_at) FROM evocations e WHERE e.user_id = u.id),
             (SELECT max(d.updated_at) FROM daily_entries d JOIN evocations e ON e.id = d.evocation_id WHERE e.user_id = u.id)
           ) AS last_activity
    FROM users u
    ORDER BY last_activity DESC NULLS LAST, u.created_at DESC
  `);
  return rows;
}

export type ActivityItem = {
  kind: "evocation" | "daily";
  user_id: number;
  user_name: string;
  angel_name: string;
  evocation_id: number;
  day_number: number | null;
  at: string;
};

export async function listRecentActivity(limit = 15): Promise<ActivityItem[]> {
  const pool = await db();
  const { rows } = await pool.query<ActivityItem>(
    `
    SELECT * FROM (
      SELECT 'evocation'::text AS kind, u.id AS user_id, u.name AS user_name, a.name AS angel_name,
             e.id AS evocation_id, NULL::int AS day_number, e.created_at AS at
      FROM evocations e JOIN users u ON u.id = e.user_id JOIN angels a ON a.id = e.angel_id
      UNION ALL
      SELECT 'daily', u.id, u.name, a.name, e.id, d.day_number, d.updated_at
      FROM daily_entries d
      JOIN evocations e ON e.id = d.evocation_id
      JOIN users u ON u.id = e.user_id
      JOIN angels a ON a.id = e.angel_id
      WHERE d.physical <> '' OR d.emotional <> '' OR d.mental <> '' OR d.spiritual <> ''
    ) t ORDER BY at DESC LIMIT $1`,
    [limit],
  );
  return rows;
}

export async function getUserById(id: number) {
  const pool = await db();
  const { rows } = await pool.query<{ id: number; name: string; email: string; role: string }>(
    "SELECT id, name, email, role FROM users WHERE id = $1",
    [id],
  );
  return rows[0] ?? null;
}
