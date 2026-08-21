/**
 * Database connection
 *
 * Uses Neon’s serverless Postgres driver so it works on Vercel
 * (no long-lived connections needed).
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL is missing. Add your Neon connection string to .env.local (see README)."
    );
  }

  const sql = neon(url);
  return drizzle(sql, { schema });
}

// Lazy singleton so importing this file does not crash during build
// when env vars are not present yet.
let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
