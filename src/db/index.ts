import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let pool: Pool | null = null;

export function getDb() {
  if (!pool) {
    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
    } else if (process.env.SQL_HOST) {
      pool = new Pool({
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        host: process.env.SQL_HOST,
      });
    } else {
      throw new Error('Database connection variables are not set');
    }
  }
  return drizzle(pool, { schema });
}
