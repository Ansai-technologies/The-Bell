// Shared database helper for Vercel serverless functions.
// The pg Pool is created once per (warm) function instance and reused across
// invocations. Use Supabase's pooled connection string (port 6543) for
// DATABASE_URL so concurrent function instances don't exhaust connections.
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';

let pool: Pool | null = null;

export function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    pool = new Pool({ connectionString, max: 1 });
  }
  return drizzle(pool, { schema });
}
