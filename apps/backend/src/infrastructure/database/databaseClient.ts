import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import type { LoggerService } from '../../common/logger/loggerService.ts';
import type { Config } from '../../core/config.ts';

import * as schema from './schema.ts';

export class DatabaseClient {
  private pool: Pool;
  public readonly db: ReturnType<typeof drizzle>;
  private readonly loggerService: LoggerService;

  public constructor(config: Config['database'], loggerService: LoggerService) {
    this.loggerService = loggerService;
    this.pool = new Pool({
      connectionString: config.url,
      ssl: config.ssl
        ? {
            rejectUnauthorized: false,
          }
        : false,
      ...config.pool,
    });

    this.pool.on('error', (error) => {
      this.loggerService.error({
        message: 'Unexpected database pool error',
        event: 'database.pool.error',
        poolSize: this.pool.totalCount,
        idleConnections: this.pool.idleCount,
        waitingClients: this.pool.waitingCount,
        err: error,
      });
    });

    this.pool.on('connect', () => {
      this.loggerService.debug({
        message: 'New database connection established',
        event: 'database.connection.established',
      });
    });

    this.pool.on('remove', () => {
      this.loggerService.debug({
        message: 'Database connection removed from pool',
        event: 'database.connection.removed',
      });
    });

    this.db = drizzle(this.pool, { schema });
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  public async testConnection(): Promise<void> {
    await this.db.execute('SELECT 1');
  }
}
