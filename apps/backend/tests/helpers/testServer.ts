import type { FastifyInstance } from 'fastify';

import { LoggerServiceFactory } from '../../src/common/logger/loggerServiceFactory.ts';
import { createConfig } from '../../src/core/config.ts';
import { HttpServer } from '../../src/core/httpServer.ts';
import { Database } from '../../src/infrastructure/database/database.ts';

let testServer: HttpServer | undefined;
let testDatabase: Database | undefined;

export async function createTestContext(): Promise<{ server: FastifyInstance; database: Database }> {
  const config = createConfig();
  const loggerService = LoggerServiceFactory.create({ logLevel: 'silent' });

  testDatabase = new Database({ url: config.database.url });
  await testDatabase.testConnection();

  testServer = new HttpServer(config, loggerService, testDatabase);
  await testServer.start();

  return {
    server: testServer.fastifyServer,
    database: testDatabase,
  };
}

export async function closeTestServer(): Promise<void> {
  if (testServer) {
    await testServer.stop();
    testServer = undefined;
  }

  if (testDatabase) {
    await testDatabase.close();
    testDatabase = undefined;
  }
}
