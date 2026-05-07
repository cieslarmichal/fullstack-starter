import type { FastifyInstance } from 'fastify';

import { EmailServiceImpl } from '../../src/common/emailService/emailServiceImpl.ts';
import { LoggerServiceFactory } from '../../src/common/logger/loggerServiceFactory.ts';
import { createConfig } from '../../src/core/config.ts';
import { EmailQueueService } from '../../src/core/emailQueueService.ts';
import { HttpServer } from '../../src/core/httpServer.ts';
import { DatabaseClient } from '../../src/infrastructure/database/databaseClient.ts';

let testServer: HttpServer | undefined;
let testDatabase: DatabaseClient | undefined;
let testEmailQueueService: EmailQueueService | undefined;

export async function createTestContext(): Promise<{ server: FastifyInstance; databaseClient: DatabaseClient }> {
  const config = createConfig();
  const loggerService = LoggerServiceFactory.create({ logLevel: 'silent' });

  testDatabase = new DatabaseClient(config.database, loggerService);
  await testDatabase.testConnection();

  // Tests don't actually queue emails to pg-boss; we just need a real instance
  // for the HttpServer constructor. config.jobs.enabled === false in test config
  // so .start() is never invoked.
  const emailService = new EmailServiceImpl(config);
  testEmailQueueService = new EmailQueueService(emailService, loggerService, config);

  testServer = new HttpServer(config, loggerService, testDatabase, testEmailQueueService);
  await testServer.start();

  return {
    server: testServer.fastifyServer,
    databaseClient: testDatabase,
  };
}

export async function closeTestServer(): Promise<void> {
  if (testServer) {
    await testServer.stop();
    testServer = undefined;
  }

  if (testEmailQueueService) {
    testEmailQueueService = undefined;
  }

  if (testDatabase) {
    await testDatabase.close();
    testDatabase = undefined;
  }
}
