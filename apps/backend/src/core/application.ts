import { LoggerServiceFactory } from '../common/logger/loggerServiceFactory.ts';
import { DatabaseClient } from '../infrastructure/database/databaseClient.ts';

import { createConfig } from './config.ts';
import { HttpServer } from './httpServer.ts';

export class Application {
  private static server: HttpServer | undefined;
  private static databaseClient: DatabaseClient | undefined;

  public static async start(): Promise<void> {
    const config = createConfig();
    const loggerService = LoggerServiceFactory.create({ logLevel: config.logLevel });
    this.databaseClient = new DatabaseClient(config.database, loggerService);
    this.server = new HttpServer(config, loggerService, this.databaseClient);

    await this.databaseClient.testConnection();

    await this.server.start();
  }

  public static async stop(): Promise<void> {
    await this.server?.stop();
    await this.databaseClient?.close();
  }
}
