import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

import { serializeError } from '../common/errors/serializeError.ts';
import { createConfig } from '../core/config.ts';

async function main(): Promise<void> {
  const config = createConfig();

  const pool = new Pool({
    connectionString: config.database.url,
    ssl: false,
  });

  const db = drizzle(pool);

  console.log('Running migrations...');

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const serializedError = serializeError(error);

  console.error({
    message: 'Unexpected error.',
    context: JSON.stringify(serializedError),
  });

  process.exit(1);
});
