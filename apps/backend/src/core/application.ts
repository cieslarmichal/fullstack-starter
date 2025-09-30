import { LoggerServiceFactory } from '../common/logger/loggerServiceFactory.ts';
import { Database } from '../infrastructure/database/database.ts';

import { createConfig } from './config.ts';
import { HttpServer } from './httpServer.ts';

export class Application {
  private static server: HttpServer | undefined;
  private static database: Database | undefined;

  public static async start(): Promise<void> {
    const config = createConfig();

    const loggerService = LoggerServiceFactory.create({ logLevel: config.logLevel });

    this.database = new Database({ url: config.database.url });

    await this.database.testConnection();

    this.server = new HttpServer(config, loggerService, this.database);

    await this.server.start();
  }

  public static async stop(): Promise<void> {
    await this.server?.stop();
    await this.database?.close();
  }
}
