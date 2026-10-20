import "server-only";
import { Pool, types } from "pg";
import bcrypt from "bcryptjs";
import { ANGELS } from "./angels";

// DATE -> string "YYYY-MM-DD" (nu obiect Date)
types.setTypeParser(1082, (v: string) => v);

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS angels (
  id   INT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evocations (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  angel_id   INT NOT NULL REFERENCES angels(id),
  evoked_on  DATE NOT NULL,
  message    TEXT NOT NULL DEFAULT '',
  sensation  TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS evocations_user_idx ON evocations(user_id, evoked_on DESC);

CREATE TABLE IF NOT EXISTS daily_entries (
  id          SERIAL PRIMARY KEY,
  evocation_id INT NOT NULL REFERENCES evocations(id) ON DELETE CASCADE,
  day_number  INT NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  physical    TEXT NOT NULL DEFAULT '',
  emotional   TEXT NOT NULL DEFAULT '',
  mental      TEXT NOT NULL DEFAULT '',
  spiritual   TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (evocation_id, day_number)
);
`;

type Globals = { __pool?: Pool; __ready?: Promise<void> };
const g = globalThis as unknown as Globals;

function getPool(): Pool {
  if (!g.__pool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL nu este setat");
    g.__pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  }
  return g.__pool;
}

async function init(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(727272)");
    await client.query(SCHEMA);

    for (let i = 0; i < ANGELS.length; i++) {
      await client.query(
        `INSERT INTO angels (id, name) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [i + 1, ANGELS[i]],
      );
    }

    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (email && password) {
      const exists = await client.query("SELECT 1 FROM users WHERE email = $1", [email]);
      if (exists.rowCount === 0) {
        const hash = await bcrypt.hash(password, 12);
        await client.query(
          "INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, 'admin')",
          [email, process.env.ADMIN_NAME || "Administrator", hash],
        );
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(727272)").catch(() => {});
    client.release();
  }
}

/** Returnează pool-ul, după ce schema și datele inițiale au fost create. */
export async function db(): Promise<Pool> {
  const pool = getPool();
  if (!g.__ready) {
    g.__ready = init(pool).catch((err) => {
      g.__ready = undefined; // permite reîncercarea (ex. DB încă pornește)
      throw err;
    });
  }
  await g.__ready;
  return pool;
}
