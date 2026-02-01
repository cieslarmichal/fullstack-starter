import { Type, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { createAuthenticationMiddleware } from '../../../common/auth/authMiddleware.ts';
import type { TokenService } from '../../../common/auth/tokenService.ts';
import { CryptoService } from '../../../common/crypto/cryptoService.ts';
import { UnauthorizedAccessError } from '../../../common/errors/unathorizedAccessError.ts';
import type { LoggerService } from '../../../common/logger/loggerService.ts';
import type { Config } from '../../../core/config.ts';
import type { DatabaseClient } from '../../../infrastructure/database/databaseClient.ts';
import { CreateUserAction } from '../application/actions/createUserAction.ts';
import { DeleteUserAction } from '../application/actions/deleteUserAction.ts';
import { FindUserAction } from '../application/actions/findUserAction.ts';
import { LoginUserAction } from '../application/actions/loginUserAction.ts';
import { LogoutUserAction } from '../application/actions/logoutUserAction.ts';
import { RefreshTokenAction } from '../application/actions/refreshTokenAction.ts';
import { PasswordService } from '../application/services/passwordService.ts';
import type { User } from '../domain/types/user.ts';
import { UserRepositoryImpl } from '../infrastructure/repositories/userRepositoryImpl.ts';
import { UserSessionRepositoryImpl } from '../infrastructure/repositories/userSessionRepositoryImpl.ts';

import {
  loginRequestSchema,
  loginResponseSchema,
  refreshTokenResponseSchema,
  registerRequestSchema,
  userSchema,
  type UserDto,
} from './userSchemas.ts';

const appEnvironment = process.env['NODE_ENV'];

export const userRoutes: FastifyPluginAsyncTypebox<{
  databaseClient: DatabaseClient;
  config: Config;
  loggerService: LoggerService;
  tokenService: TokenService;
}> = async function (fastify, opts) {
  const { config, databaseClient, loggerService, tokenService } = opts;

  // Idempotency window and single-flight coordination for refresh calls
  // Keyed by refresh token hash to avoid storing sensitive data.
  const inFlightRefreshes = new Map<string, Promise<{ accessToken: string; refreshToken: string }>>();
  const recentRefreshes = new Map<
    string,
    { result: { accessToken: string; refreshToken: string }; timestamp: number }
  >();

  const mapUserToResponse = (user: User): UserDto => {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  };

  const refreshTokenCookie = {
    name: 'refresh-token',
    config: {
      httpOnly: true,
      secure: true,
      sameSite: appEnvironment === 'production' ? ('lax' as const) : ('none' as const),
      path: '/',
      maxAge: config.token.refresh.expiresIn,
      // TODO: adjust domain as needed
      ...(appEnvironment === 'production' ? { domain: '.fullstack-starter.com' } : {}),
    },
  };

  const userRepository = new UserRepositoryImpl(databaseClient);
  const userSessionRepository = new UserSessionRepositoryImpl(databaseClient);
  const passwordService = new PasswordService(config);

  const createUserAction = new CreateUserAction(userRepository, loggerService, passwordService);
  const findUserAction = new FindUserAction(userRepository);
  const deleteUserAction = new DeleteUserAction(userRepository, loggerService);
  const loginUserAction = new LoginUserAction(
    userRepository,
    loggerService,
    tokenService,
    passwordService,
    userSessionRepository,
  );
  const refreshTokenAction = new RefreshTokenAction(
    userRepository,
    userSessionRepository,
    loggerService,
    tokenService,
    config,
    databaseClient,
  );
  const logoutUserAction = new LogoutUserAction(userSessionRepository, tokenService);

  const authenticationMiddleware = createAuthenticationMiddleware(tokenService);

  fastify.post('/users/register', {
    schema: {
      body: registerRequestSchema,
      response: {
        201: userSchema,
      },
    },
    config: {
      rateLimit: config.rateLimit.register,
    },
    handler: async (request, reply) => {
      const user = await createUserAction.execute(
        {
          email: request.body.email,
          password: request.body.password,
        },
        {
          requestId: request.id,
        },
      );

      return reply.status(201).send(mapUserToResponse(user));
    },
  });

  fastify.get('/users/me', {
    schema: {
      response: {
        200: userSchema,
      },
    },
    config: {
      rateLimit: config.rateLimit.profile,
    },
    preValidation: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;

      const user = await findUserAction.execute(userId);

      return reply.send(mapUserToResponse(user));
    },
  });

  fastify.post('/users/login', {
    schema: {
      body: loginRequestSchema,
      response: {
        200: loginResponseSchema,
      },
    },
    config: {
      rateLimit: config.rateLimit.login,
    },
    handler: async (request, reply) => {
      const { email, password } = request.body;

      const result = await loginUserAction.execute(
        { email, password },
        {
          requestId: request.id,
        },
      );

      reply.setCookie(refreshTokenCookie.name, result.refreshToken, refreshTokenCookie.config);

      return reply.send({ accessToken: result.accessToken });
    },
  });

  fastify.post('/users/logout', {
    schema: {
      response: {
        204: Type.Null(),
      },
    },
    config: {
      rateLimit: config.rateLimit.logout,
    },
    handler: async (request, reply) => {
      const refreshToken = request.cookies[refreshTokenCookie.name];

      await logoutUserAction.execute({ refreshToken });

      reply.clearCookie(refreshTokenCookie.name, { path: refreshTokenCookie.config.path });

      return reply.status(204).send();
    },
  });

  fastify.post('/users/refresh-token', {
    schema: {
      response: {
        200: refreshTokenResponseSchema,
        401: Type.Object({
          name: Type.String(),
          message: Type.String(),
        }),
      },
    },
    config: {
      rateLimit: config.rateLimit.refreshToken,
    },
    handler: async (request, reply) => {
      const refreshToken = request.cookies[refreshTokenCookie.name];

      if (!refreshToken) {
        // Don't log this as an error - it's expected for unauthenticated users
        // Just return 401 silently
        return reply.status(401).send({
          name: 'UnauthorizedAccessError',
          message: 'Refresh token not found',
        });
      }

      const tokenHash = CryptoService.hashData(refreshToken);

      // Short-circuit for very recent duplicate refresh attempts (e.g., rapid page reloads)
      const recent = recentRefreshes.get(tokenHash);
      const now = Date.now();
      if (recent && now - recent.timestamp <= config.token.refresh.idempotencyMs) {
        reply.setCookie(refreshTokenCookie.name, recent.result.refreshToken, refreshTokenCookie.config);
        return reply.send({ accessToken: recent.result.accessToken });
      }

      // Ensure single-flight per tokenHash
      let promise = inFlightRefreshes.get(tokenHash);
      if (!promise) {
        promise = refreshTokenAction.execute(
          { refreshToken },
          {
            requestId: request.id,
          },
        );
        inFlightRefreshes.set(tokenHash, promise);
      }

      let result: { accessToken: string; refreshToken: string };
      try {
        result = await promise;

        // Cache result briefly for idempotency window
        recentRefreshes.set(tokenHash, { result, timestamp: now });

        // Opportunistic cleanup of stale recent entries
        for (const [key, entry] of recentRefreshes) {
          if (now - entry.timestamp > config.token.refresh.idempotencyMs) {
            recentRefreshes.delete(key);
          }
        }
      } finally {
        inFlightRefreshes.delete(tokenHash);
      }

      reply.setCookie(refreshTokenCookie.name, result.refreshToken, refreshTokenCookie.config);
      return reply.send({ accessToken: result.accessToken });
    },
  });

  fastify.delete('/users/me', {
    schema: {
      response: {
        204: Type.Null(),
      },
    },
    config: {
      rateLimit: config.rateLimit.accountDeletion,
    },
    preValidation: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;

      await deleteUserAction.execute(userId, {
        requestId: request.id,
        userId,
      });

      return reply.status(204).send();
    },
  });
};
