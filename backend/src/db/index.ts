import { createClient } from '@libsql/client';
import { config } from '../config';

let dbClient: ReturnType<typeof createClient> | null = null;

export function getDb() {
  if (!dbClient) {
    dbClient = createClient({
      url: config.TURSO_DATABASE_URL,
      authToken: config.TURSO_AUTH_TOKEN,
    });
  }
  return dbClient;
}

export async function query(sql: string, params?: unknown[]) {
  const db = getDb();
  return db.execute({
    sql,
    args: (params || []) as never[],
  });
}

export async function queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null> {
  const result = await getDb().execute({
    sql,
    args: (params || []) as never[],
  });
  const rows = result.rows as unknown as T[];
  return rows.length > 0 ? rows[0] : null;
}

export async function queryMany<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
  const result = await getDb().execute({
    sql,
    args: (params || []) as never[],
  });
  return result.rows as unknown as T[];
}
