import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

import { createConfig } from '../src/core/config.ts';

export async function setup(): Promise<void> {
  await setupDb();
}

async function setupDb(): Promise<void> {
  try {
    const config = createConfig();

    const pool = new Pool({
      connectionString: config.database.url,
      ssl: false,
    });

    const db = drizzle(pool);

    console.log('Running test database migrations...');

    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('Database: migrations run succeed.');

    await pool.end();
  } catch (error) {
    console.log('Database: migrations run error.');
    console.log(error);
    process.exit(1);
  }
}
