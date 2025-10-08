/* eslint-disable @typescript-eslint/no-explicit-any */
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import crypto from 'crypto';
import { fastify, type FastifyInstance } from 'fastify';
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
import type { Database } from '../infrastructure/database/database.ts';
import { userRoutes } from '../modules/user/routes/userRoutes.ts';

import { type Config } from './config.ts';

export class HttpServer {
  public readonly fastifyServer: FastifyInstance;
  private readonly loggerService: LoggerService;
  private readonly config: Config;
  private readonly database: Database;
  private isShuttingDown = false;

  public constructor(config: Config, loggerService: LoggerService, database: Database) {
    this.config = config;
    this.loggerService = loggerService;
    this.database = database;

    this.fastifyServer = fastify({
      bodyLimit: 10 * 1024 * 1024,
      logger: false,
      genReqId: () => crypto.randomUUID(),
      requestIdLogLabel: 'reqId',
    }).withTypeProvider<TypeBoxTypeProvider>();
  }

  public async start(): Promise<void> {
    const { host, port } = this.config.server;

    this.setupErrorHandler();

    await this.fastifyServer.register(fastifyMultipart, {
      limits: {
        fileSize: 1024 * 1024 * 1024 * 4,
      },
    });

    await this.fastifyServer.register(fastifyCookie, {
      secret: this.config.cookie.secret,
      parseOptions: {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
      },
    });

    await this.fastifyServer.register(fastifyHelmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          objectSrc: ["'none'"],
          fontSrc: ["'self'"],
        },
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
    });

    await this.fastifyServer.register(fastifyCors, {
      origin: this.config.frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    this.fastifyServer.addHook('onRequest', (request, _reply, done) => {
      if (!request.url.includes('/health')) {
        this.loggerService.info({
          message: 'Incoming request...',
          reqId: request.id,
          req: {
            method: request.method,
            url: request.url,
          },
        });
      }
      done();
    });

    this.fastifyServer.addHook('onSend', (request, reply, _payload, done) => {
      if (!request.url.includes('/health')) {
        this.loggerService.info({
          message: 'Request completed.',
          reqId: request.id,
          method: request.method,
          url: request.url,
          statusCode: reply.statusCode,
        });
      }
      done();
    });

    this.fastifyServer.setSerializerCompiler(() => {
      return (data): string => JSON.stringify(data);
    });

    this.addRequestPreprocessing();

    await this.registerRoutes();

    await this.fastifyServer.listen({ port, host });

    this.loggerService.info({
      message: 'HTTP server started.',
      port,
      host,
    });
  }

  public async stop(): Promise<void> {
    if (this.isShuttingDown) {
      this.loggerService.warn({
        message: 'HTTP server is already shutting down, ignoring stop request...',
      });
      return;
    }

    this.isShuttingDown = true;

    this.loggerService.info({
      message: 'Stopping HTTP server...',
    });

    await this.fastifyServer.close();

    this.loggerService.info({
      message: 'HTTP server stopped.',
    });
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
      if (error instanceof TypeError) {
        const serializedError = serializeError(error, true);

        this.loggerService.error({
          message: 'HTTP request error',
          reqId: request.id,
          error: serializedError,
          endpoint: `${request.method} ${request.url}`,
        });

        return reply.status(httpStatusCodes.internalServerError).send({
          name: 'InternalServerError',
          message: 'Internal server error',
        });
      }
      const serializedError = serializeError(error);

      this.loggerService.error({
        message: 'HTTP request error',
        reqId: request.id,
        error: serializedError,
        endpoint: `${request.method} ${request.url}`,
      });

      const responseError = {
        ...serializedError,
        stack: undefined,
        cause: undefined,
        context: {
          ...(serializedError['context'] ? (serializedError['context'] as Record<string, unknown>) : {}),
          originalError: undefined,
        },
      };

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
        return reply.status(httpStatusCodes.unauthorized).send(responseError);
      }

      if (error instanceof ForbiddenAccessError) {
        return reply.status(httpStatusCodes.forbidden).send(responseError);
      }

      return reply.status(httpStatusCodes.internalServerError).send({
        name: 'InternalServerError',
        message: 'Internal server error',
      });
    });
  }

  private addRequestPreprocessing(): void {
    this.fastifyServer.addHook('preValidation', (request, _reply, next) => {
      const body = request.body as Record<string, unknown>;

      this.trimStringProperties(body);

      next();
    });
  }

  private trimStringProperties(obj: Record<string, any>): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          this.trimStringProperties(obj[key] as Record<string, any>);
        }
      }
    }
  }

  private async registerRoutes(): Promise<void> {
    const tokenService = new TokenService(this.config);

    await this.fastifyServer.register(userRoutes, {
      database: this.database,
      config: this.config,
      loggerService: this.loggerService,
      tokenService,
    });

    this.fastifyServer.get('/health', async (_request, reply) => {
      reply.send({ healthy: true });
    });
  }
}
