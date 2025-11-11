import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema.ts';

export interface DatabaseConfig {
  readonly url: string;
  readonly ssl: boolean;
  readonly pool: {
    readonly min: number;
    readonly max: number;
    readonly idleTimeoutMillis: number;
    readonly connectionTimeoutMillis: number;
  };
}

export class DatabaseClient {
  private pool: Pool;
  public readonly db: ReturnType<typeof drizzle>;

  public constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      connectionString: config.url,
      ssl: config.ssl
        ? {
            rejectUnauthorized: true,
          }
        : false,
      min: config.pool.min,
      max: config.pool.max,
      idleTimeoutMillis: config.pool.idleTimeoutMillis,
      connectionTimeoutMillis: config.pool.connectionTimeoutMillis,
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
