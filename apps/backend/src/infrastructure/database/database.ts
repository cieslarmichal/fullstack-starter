import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema.ts';

export interface DatabaseConfig {
  readonly url: string;
}

export class Database {
  private pool: Pool;
  public readonly db: ReturnType<typeof drizzle>;

  public constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      connectionString: config.url,
      ssl: false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.db = drizzle(this.pool, { schema });
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  public async testConnection(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
  }
}
