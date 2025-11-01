import { sql } from 'drizzle-orm';

import type { Database } from '../../src/infrastructure/database/database.ts';

export async function truncateTables(database: Database): Promise<void> {
  const tables = ['users', 'user_sessions'];

  for (const table of tables) {
    await database.db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
  }
}

export async function cleanupTables(database: Database, tableNames: string[]): Promise<void> {
  for (const table of tableNames) {
    await database.db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
  }
}
