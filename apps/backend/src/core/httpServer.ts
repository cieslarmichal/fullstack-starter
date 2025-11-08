import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
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
import { serializeError } from '../common/errors/serializeError.ts';
import { UnauthorizedAccessError } from '../common/errors/unathorizedAccessError.ts';
import { httpStatusCodes } from '../common/http/httpStatusCode.ts';
import { type LoggerService } from '../common/logger/loggerService.ts';
import { UuidService } from '../common/uuid/uuidService.ts';
import type { DatabaseClient } from '../infrastructure/database/databaseClient.ts';
import { userRoutes } from '../modules/user/routes/userRoutes.ts';

import { type Config } from './config.ts';

const maxObjectDepth = 10;
const maxStringLength = 10000;
const maxBodySize = 512 * 1024; // 512KB

export class HttpServer {
  public readonly fastifyServer: FastifyInstance;
  private readonly loggerService: LoggerService;
  private readonly config: Config;
  private readonly databaseClient: DatabaseClient;
  private isShuttingDown = false;
  private activeConnections = 0;

  public constructor(config: Config, loggerService: LoggerService, databaseClient: DatabaseClient) {
    this.config = config;
    this.loggerService = loggerService;
    this.databaseClient = databaseClient;

    this.fastifyServer = fastify({
      bodyLimit: maxBodySize,
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
    await this.fastifyServer.register(fastifyHelmet, {
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'no-referrer' },
      xContentTypeOptions: true,
      xFrameOptions: { action: 'deny' },
      xPermittedCrossDomainPolicies: { permittedPolicies: 'none' },
      xDownloadOptions: true,
      xDnsPrefetchControl: { allow: false },
      hidePoweredBy: true,
    });
    await this.fastifyServer.register(fastifyRateLimit, {
      global: true,
      max: this.config.rateLimit.global.max,
      timeWindow: this.config.rateLimit.global.timeWindow,
      cache: 10000,
      skipOnError: false,
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

      const requestId = UuidService.generateUuid();
      request.id = requestId;
      reply.header('X-Request-ID', requestId);

      this.activeConnections++;

      this.loggerService.debug({
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

      this.loggerService.debug({
        message: 'Request completed',
        event: 'http.request.end',
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        userId: request.user?.userId,
      });

      done();
    });

    this.fastifyServer.addHook('onResponse', (_request, _reply, done) => {
      this.activeConnections--;
      done();
    });

    this.fastifyServer.setSerializerCompiler(() => {
      return (data): string => JSON.stringify(data);
    });

    this.fastifyServer.addHook('preHandler', async (request, reply) => {
      if (
        request.body &&
        typeof request.body === 'object' &&
        request.headers['content-type']?.includes('application/json')
      ) {
        try {
          request.body = this.sanitizeInput(request.body, 0);
        } catch (error) {
          this.loggerService.warn({
            message: 'Input sanitization failed',
            event: 'http.request.input_sanitization_failed',
            requestId: request.id,
            method: request.method,
            url: request.url,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          return reply.status(httpStatusCodes.badRequest).send({
            name: 'InputNotValidError',
            message: 'Invalid input: object too deep or string too long',
          });
        }
      }
    });

    await this.registerRoutes();

    await this.fastifyServer.listen({ port, host });

    this.loggerService.info({ message: 'HTTP server started', port, host });
  }

  public async stop(): Promise<void> {
    if (this.isShuttingDown) {
      this.loggerService.warn({ message: 'HTTP server is already shutting down' });
      return;
    }

    this.isShuttingDown = true;

    this.loggerService.info({ message: 'Stopping HTTP server' });

    // Stop accepting new connections
    this.fastifyServer.server.unref();

    // Wait for active connections to finish (with timeout)
    const shutdownTimeout = 30000; // 30s
    const shutdownStart = Date.now();

    while (this.activeConnections > 0 && Date.now() - shutdownStart < shutdownTimeout) {
      this.loggerService.info({
        message: 'Waiting for active connections to finish',
        activeConnections: this.activeConnections,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (this.activeConnections > 0) {
      this.loggerService.warn({
        message: 'Forcing shutdown with active connections',
        activeConnections: this.activeConnections,
      });
    }

    await this.fastifyServer.close();

    this.loggerService.info({ message: 'HTTP server stopped.' });
  }

  private setupErrorHandler(): void {
    this.fastifyServer.setSchemaErrorFormatter((errors, dataVar) => {
      const { instancePath, message } = errors[0] as FastifySchemaValidationError;

      return new InputNotValidError({
        reason: `${dataVar}${instancePath} ${message || 'error'}`,
        value: undefined,
      });
    });

    this.fastifyServer.setErrorHandler((error, request, reply) => {
      const requestId = request.id;

      if (error instanceof TypeError) {
        this.loggerService.error({
          message: 'HTTP request type error',
          event: 'http.request.error',
          requestId,
          method: request.method,
          url: request.url,
          err: error,
        });

        return reply.status(httpStatusCodes.internalServerError).send({
          name: 'InternalServerError',
          message: 'Internal server error',
        });
      }

      if ('statusCode' in error && error.statusCode === 429) {
        this.loggerService.warn({
          message: 'Rate limit exceeded',
          event: 'http.request.rate_limited',
          requestId,
          method: request.method,
          url: request.url,
          ip: request.ip,
          error: error.message,
        });

        return reply.status(429).send({
          name: 'TooManyRequestsError',
          message: error.message || 'Rate limit exceeded',
        });
      }

      this.loggerService.error({
        message: 'HTTP request error',
        event: 'http.request.error',
        requestId,
        method: request.method,
        url: request.url,
        err: error,
      });

      const responseError = this.sanitizeErrorResponse(error);

      if (error instanceof InputNotValidError) {
        return reply.status(httpStatusCodes.badRequest).send(responseError);
      }

      if (error instanceof ResourceNotFoundError) {
        return reply.status(httpStatusCodes.notFound).send(responseError);
      }

      if (error instanceof OperationNotValidError) {
        return reply.status(httpStatusCodes.badRequest).send(responseError);
      }

      if (error instanceof ResourceAlreadyExistsError) {
        return reply.status(httpStatusCodes.conflict).send(responseError);
      }

      if (error instanceof UnauthorizedAccessError) {
        this.loggerService.warn({
          message: 'Unauthorized access attempt',
          event: 'http.request.error',
          requestId,
          method: request.method,
          url: request.url,
          ip: request.ip,
        });

        return reply.status(httpStatusCodes.unauthorized).send(responseError);
      }

      if (error instanceof ForbiddenAccessError) {
        this.loggerService.warn({
          message: 'Forbidden access attempt',
          event: 'http.request.error',
          requestId,
          method: request.method,
          url: request.url,
          ip: request.ip,
        });

        return reply.status(httpStatusCodes.forbidden).send(responseError);
      }

      return reply.status(httpStatusCodes.internalServerError).send({
        name: 'InternalServerError',
        message: 'Internal server error',
      });
    });
  }

  private sanitizeErrorResponse(errorRaw: Error): Record<string, unknown> {
    const error = serializeError(errorRaw);
    const allowedFields = ['name', 'message'];
    const sanitized: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in error) {
        sanitized[field] = error[field];
      }
    }

    if (error['context'] && typeof error['context'] === 'object') {
      const context = error['context'] as Record<string, unknown>;
      const safeContext: Record<string, unknown> = {};

      const allowedContextFields = ['reason', 'value', 'field'];

      for (const field of allowedContextFields) {
        if (field in context) {
          safeContext[field] = context[field];
        }
      }

      if (Object.keys(safeContext).length > 0) {
        sanitized['context'] = safeContext;
      }
    }

    return sanitized;
  }

  private sanitizeInput(obj: unknown, depth: number): unknown {
    // Prevent deeply nested objects (DoS protection)
    if (depth > maxObjectDepth) {
      throw new Error(`Object nesting exceeds maximum depth of ${String(maxObjectDepth)}`);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeInput(item, depth + 1));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        sanitized[key] = this.sanitizeInput(value, depth + 1);
      }

      return sanitized;
    }

    if (typeof obj === 'string') {
      // Prevent extremely long strings (DoS protection)
      if (obj.length > maxStringLength) {
        throw new Error(`String length exceeds maximum of ${String(maxStringLength)} characters`);
      }

      return obj.trim();
    }

    return obj;
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
      const checks: Record<string, { status: 'healthy' | 'unhealthy'; latencyMs?: number; error?: string }> = {};

      try {
        const dbStart = Date.now();
        await this.databaseClient.db.execute('SELECT 1');
        checks['database'] = { status: 'healthy', latencyMs: Date.now() - dbStart };
      } catch (error) {
        checks['database'] = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      const allHealthy = Object.values(checks).every((check) => check.status === 'healthy');
      const statusCode = allHealthy ? httpStatusCodes.ok : httpStatusCodes.internalServerError;

      const response = {
        status: allHealthy ? 'healthy' : 'unhealthy',
        checks,
      };

      if (!allHealthy) {
        this.loggerService.warn({
          message: 'Health check failed',
          event: 'http.health_check.failed',
          checks,
        });
      }

      return reply.status(statusCode).send(response);
    });
  }
}
