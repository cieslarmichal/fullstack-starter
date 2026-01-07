import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { fastify, type FastifyInstance, type FastifyRequest } from 'fastify';
import type { FastifySchemaValidationError } from 'fastify/types/schema.js';

import { TokenService } from '../common/auth/tokenService.ts';
import { ForbiddenAccessError } from '../common/errors/forbiddenAccessError.ts';
import { InputNotValidError } from '../common/errors/inputNotValidError.ts';
import { OperationNotValidError } from '../common/errors/operationNotValidError.ts';
import { ResourceAlreadyExistsError } from '../common/errors/resourceAlreadyExistsError.ts';
import { ResourceNotFoundError } from '../common/errors/resourceNotFoundError.ts';
import { UnauthorizedAccessError } from '../common/errors/unathorizedAccessError.ts';
import { type LoggerService } from '../common/logger/loggerService.ts';
import { UuidService } from '../common/uuid/uuidService.ts';
import type { DatabaseClient } from '../infrastructure/database/databaseClient.ts';
import { userRoutes } from '../modules/user/routes/userRoutes.ts';

import { type Config } from './config.ts';

export class HttpServer {
  public readonly fastifyServer: FastifyInstance;
  private readonly loggerService: LoggerService;
  private readonly config: Config;
  private readonly databaseClient: DatabaseClient;

  public constructor(config: Config, loggerService: LoggerService, databaseClient: DatabaseClient) {
    this.config = config;
    this.loggerService = loggerService;
    this.databaseClient = databaseClient;

    this.fastifyServer = fastify({
      bodyLimit: 512 * 1024, // 512KB,
      logger: false,
      connectionTimeout: 30000, // 30s
      keepAliveTimeout: 5000, // 5s
      requestTimeout: 30000, // 30s
      trustProxy: true,
    }).withTypeProvider<TypeBoxTypeProvider>();
  }

  public async start(): Promise<void> {
    const { host, port } = this.config.server;

    this.setupErrorHandler();

    await this.fastifyServer.register(fastifyCookie, { secret: this.config.cookie.secret });
    await this.fastifyServer.register(fastifyCors, {
      origin: this.config.frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Request-ID'],
    });
    await this.fastifyServer.register(fastifyRateLimit, {
      global: true,
      max: this.config.rateLimit.global.max,
      timeWindow: this.config.rateLimit.global.timeWindow,
      keyGenerator: (request) => request.ip,
    });

    const skipRequestLog = (request: FastifyRequest): boolean => {
      const isOptions = request.method === 'OPTIONS';
      const isHealth = request.url.includes('/health');
      return isOptions || isHealth;
    };

    this.fastifyServer.addHook('onRequest', (request, reply, done) => {
      if (skipRequestLog(request)) {
        done();
        return;
      }

      request.startTime = Date.now();

      const requestId = UuidService.generateUuid();
      request.id = requestId;
      reply.header('X-Request-ID', requestId);

      this.loggerService.info({
        message: 'Incoming HTTP request',
        event: 'http.request.start',
        requestId: request.id,
        method: request.method,
        url: request.url,
      });

      done();
    });

    this.fastifyServer.addHook('onSend', (request, reply, _payload, done) => {
      if (skipRequestLog(request)) {
        done();
        return;
      }

      const durationMs = request.startTime ? Date.now() - request.startTime : undefined;

      this.loggerService.info({
        message: 'Request completed',
        event: 'http.request.end',
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        userId: request.user?.userId,
        durationMs,
      });

      done();
    });

    await this.registerRoutes();

    await this.fastifyServer.listen({ port, host });

    this.loggerService.info({ message: 'HTTP server started', port, host });
  }

  public async stop(): Promise<void> {
    this.loggerService.info({ message: 'Stopping HTTP server' });

    await this.fastifyServer.close();

    this.loggerService.info({ message: 'HTTP server stopped' });
  }

  private setupErrorHandler(): void {
    this.fastifyServer.setSchemaErrorFormatter((errors, dataVar) => {
      const { instancePath, message } = errors[0] as FastifySchemaValidationError;

      return new InputNotValidError({
        reason: `${dataVar}${instancePath} ${message || 'error'}`,
      });
    });

    this.fastifyServer.setErrorHandler((error, request, reply) => {
      const requestId = request.id;
      const baseContext = {
        requestId,
        method: request.method,
        url: request.url,
        userId: request.user?.userId,
        ip: request.ip,
      };

      if (error instanceof TypeError) {
        this.loggerService.error({
          message: 'HTTP request type error',
          event: 'http.request.type_error',
          ...baseContext,
          err: error,
        });

        return reply.status(500).send({
          name: 'InternalServerError',
          message: 'Internal server error',
        });
      }

      if (error instanceof Error && 'statusCode' in error && error.statusCode === 429) {
        this.loggerService.warn({
          message: 'Rate limit exceeded',
          event: 'http.request.rate_limited',
          ...baseContext,
        });

        return reply.status(429).send({
          name: 'TooManyRequestsError',
          message: error.message || 'Rate limit exceeded',
        });
      }

      if (error instanceof UnauthorizedAccessError) {
        // Only log if not marked as silent (expected auth failures like missing refresh token)
        if (!error.isSilent) {
          this.loggerService.warn({
            message: 'Unauthorized access attempt',
            event: 'http.request.unauthorized',
            ...baseContext,
            errorContext: error.context,
          });
        }

        return reply.status(401).send(error.toJSON());
      }

      if (error instanceof ForbiddenAccessError) {
        this.loggerService.warn({
          message: 'Forbidden access attempt',
          event: 'http.request.forbidden',
          ...baseContext,
          errorContext: error.context,
        });

        return reply.status(403).send(error.toJSON());
      }

      if (error instanceof InputNotValidError) {
        this.loggerService.info({
          message: 'Invalid input',
          event: 'http.request.validation_error',
          ...baseContext,
          errorContext: error.context,
        });

        return reply.status(400).send(error.toJSON());
      }

      if (error instanceof OperationNotValidError) {
        this.loggerService.info({
          message: 'Invalid operation',
          event: 'http.request.operation_error',
          ...baseContext,
          errorContext: error.context,
        });

        return reply.status(400).send(error.toJSON());
      }

      if (error instanceof ResourceNotFoundError) {
        this.loggerService.info({
          message: 'Resource not found',
          event: 'http.request.not_found',
          ...baseContext,
          errorContext: error.context,
        });

        return reply.status(404).send(error.toJSON());
      }

      if (error instanceof ResourceAlreadyExistsError) {
        this.loggerService.warn({
          message: 'Resource conflict',
          event: 'http.request.conflict',
          ...baseContext,
          errorContext: error.context,
        });

        return reply.status(409).send(error.toJSON());
      }

      this.loggerService.error({
        message: 'Unexpected error',
        event: 'http.request.unexpected_error',
        ...baseContext,
        err: error,
      });

      return reply.status(500).send({
        name: 'InternalServerError',
        message: 'Internal server error',
      });
    });
  }

  private async registerRoutes(): Promise<void> {
    const tokenService = new TokenService(this.config);

    await this.fastifyServer.register(userRoutes, {
      databaseClient: this.databaseClient,
      config: this.config,
      loggerService: this.loggerService,
      tokenService,
    });

    this.fastifyServer.get('/health', async (_request, reply) => {
      try {
        await this.databaseClient.testConnection();
        return await reply.status(200).send({ status: 'healthy' });
      } catch (error) {
        this.loggerService.warn({
          message: 'Health check failed',
          event: 'http.health_check.failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return await reply.status(500).send({ status: 'unhealthy' });
      }
    });
  }
}
